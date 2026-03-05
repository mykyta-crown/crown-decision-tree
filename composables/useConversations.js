/**
 * Composable: useConversations
 * Gestion des conversations et messages avec Supabase Realtime
 */

export const useConversations = () => {
  const supabase = useSupabaseClient()
  const conversations = ref([])
  const currentConversation = ref(null)
  const messagesRaw = ref([])
  const loading = ref(false)
  const error = ref(null)
  const realtimeChannel = ref(null)

  // Messages triés chronologiquement par created_at
  const messages = computed(() => {
    return [...messagesRaw.value].sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime()
      const dateB = new Date(b.created_at || 0).getTime()
      return dateA - dateB
    })
  })

  /**
   * Créer une nouvelle conversation
   */
  const createConversation = async (gptId, title = null) => {
    loading.value = true
    error.value = null

    // Get user locale from localStorage
    const locale = import.meta.client ? localStorage.getItem('crown-locale') || 'en' : 'en'

    try {
      const { data } = await $fetch('/api/conversations/create', {
        method: 'POST',
        body: { gpt_id: gptId, title, locale }
      })

      if (data) {
        conversations.value.unshift(data)
        return data
      }
    } catch (err) {
      error.value = err.data?.message || 'Failed to create conversation'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupérer les conversations de l'utilisateur
   */
  const fetchConversations = async (gptId = null) => {
    loading.value = true
    error.value = null

    try {
      const url = gptId ? `/api/conversations/list?gpt_id=${gptId}` : '/api/conversations/list'

      const { data } = await $fetch(url)
      conversations.value = data || []
      return data
    } catch (err) {
      error.value = err.data?.message || 'Failed to fetch conversations'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Récupérer les messages d'une conversation
   */
  const fetchMessages = async (conversationId) => {
    loading.value = true
    error.value = null

    try {
      const { data } = await $fetch(`/api/conversations/${conversationId}/messages`)
      messagesRaw.value = data || []
      return data
    } catch (err) {
      error.value = err.data?.message || 'Failed to fetch messages'
      throw err
    } finally {
      loading.value = false
    }
  }

  /**
   * Envoyer un message (retourne immédiatement)
   * Le streaming est géré par le worker backend + Supabase Realtime
   * @param {string} conversationId - ID of the conversation
   * @param {string} content - Message content
   * @param {Array<string>} documentIds - Optional array of document IDs to attach
   * @param {boolean} useEdge - Use Edge Runtime SSE streaming (Phase 2) instead of await + Realtime (Phase 1)
   */
  const sendMessage = async (conversationId, content, documentIds = [], useEdge = true) => {
    error.value = null

    // Phase 2: Edge Runtime + SSE streaming
    if (useEdge) {
      return sendMessageEdge(conversationId, content, documentIds)
    }

    // Phase 1: Node.js await + Realtime (fallback)
    try {
      const { message_id, status } = await $fetch(`/api/conversations/${conversationId}/send`, {
        method: 'POST',
        body: {
          content,
          document_ids: documentIds
        }
      })

      // Ne pas créer les messages localement (ni utilisateur, ni assistant)
      // Ils seront tous les deux créés par le serveur et notifiés via Supabase Realtime
      // Cela garantit l'ordre correct des messages

      return message_id
    } catch (err) {
      error.value = err.data?.message || 'Failed to send message'
      throw err
    }
  }

  /**
   * Envoyer un message avec Edge Runtime SSE streaming (Phase 2)
   * @param {string} conversationId - ID of the conversation
   * @param {string} content - Message content
   * @param {Array<string>} documentIds - Optional array of document IDs to attach
   */
  const sendMessageEdge = async (conversationId, content, documentIds = []) => {
    try {
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      // Get user locale from localStorage
      const locale = import.meta.client ? localStorage.getItem('crown-locale') || 'en' : 'en'

      // Appeler l'endpoint Edge SSE
      const response = await fetch(`/api/conversations/${conversationId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ content, document_ids: documentIds, locale })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Stream failed: ${response.status} ${errorText}`)
      }

      // Attendre que Realtime notifie le message assistant (créé par le backend)
      // On attend max 2 secondes
      let assistantMessage = null
      const waitStart = Date.now()
      while (!assistantMessage && Date.now() - waitStart < 2000) {
        await new Promise((resolve) => setTimeout(resolve, 100))
        // Chercher le dernier message assistant en status 'generating'
        assistantMessage = messagesRaw.value
          .slice()
          .reverse()
          .find((m) => m.role === 'assistant' && m.status === 'generating')
      }

      if (!assistantMessage) {
        console.warn('Assistant message not found via Realtime, creating temporary one')
        // Fallback: créer un message temporaire
        assistantMessage = {
          id: 'temp-' + Date.now(),
          conversation_id: conversationId,
          role: 'assistant',
          content: '',
          status: 'generating',
          created_at: new Date().toISOString(),
          documents: []
        }
        messagesRaw.value.push(assistantMessage)
      }

      // Lire le stream SSE et mettre à jour le message réel
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''
      let fullContent = ''
      let fullReasoning = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          // Marquer comme completed
          assistantMessage.status = 'completed'
          assistantMessage.reasoning = null // Clear reasoning when done
          assistantMessage.isReasoning = false
          assistantMessage.isSimulatedThinking = false
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue

          const dataStr = line.slice(6).trim()
          if (dataStr === '[DONE]') {
            continue
          }

          try {
            const data = JSON.parse(dataStr)

            // Handle reasoning tokens (thinking phase)
            if (data.type === 'reasoning' && data.reasoning) {
              fullReasoning += data.reasoning
              // Update message with reasoning content (for UI to display)
              assistantMessage.reasoning = fullReasoning
              assistantMessage.isReasoning = true
            }

            // Handle reasoning complete signal
            if (data.type === 'reasoning_complete') {
              assistantMessage.isReasoning = false
            }

            // Handle simulated thinking started signal (for OpenAI models that use reasoning internally)
            // This shows the purple thinking box without content after 4s delay
            if (data.type === 'thinking_started') {
              assistantMessage.isReasoning = true
              assistantMessage.isSimulatedThinking = true // Flag to indicate no reasoning content expected
            }

            // Handle simulated thinking complete signal
            if (data.type === 'thinking_complete') {
              assistantMessage.isReasoning = false
              assistantMessage.isSimulatedThinking = false
            }

            // Handle regular content
            if (data.content) {
              fullContent += data.content
              // Mettre à jour le message en temps réel
              assistantMessage.content = fullContent
              assistantMessage.isReasoning = false
              assistantMessage.isSimulatedThinking = false
            }
          } catch (err) {
            console.error('Failed to parse SSE data:', err)
          }
        }
      }

      return assistantMessage.id
    } catch (err) {
      error.value = err.message || 'Failed to send message'
      throw err
    }
  }

  /**
   * Setup Supabase Realtime listener pour une conversation
   * Écoute les updates de messages en temps réel
   */
  const listenToConversation = (conversationId) => {
    // Nettoyer l'ancienne subscription si elle existe
    if (realtimeChannel.value) {
      realtimeChannel.value.unsubscribe()
    }

    // Créer un nouveau channel Realtime
    realtimeChannel.value = supabase
      .channel(`conversation-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*', // INSERT, UPDATE, DELETE
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          console.log('Realtime event:', payload.eventType, payload.new)

          if (payload.eventType === 'INSERT') {
            // Nouveau message - charger avec les documents
            const existingIndex = messagesRaw.value.findIndex((m) => m.id === payload.new.id)
            if (existingIndex === -1) {
              // Charger les documents associés au message
              const { data: messageWithDocs } = await supabase
                .from('messages')
                .select(
                  `
                  *,
                  message_documents (
                    document_id,
                    documents (
                      id,
                      filename,
                      file_type,
                      file_size
                    )
                  )
                `
                )
                .eq('id', payload.new.id)
                .single()

              if (messageWithDocs) {
                // Transform to flatten documents
                const transformedMessage = {
                  ...messageWithDocs,
                  documents:
                    messageWithDocs.message_documents?.map((md) => md.documents).filter(Boolean) ||
                    []
                }
                delete transformedMessage.message_documents
                messagesRaw.value.push(transformedMessage)
              } else {
                messagesRaw.value.push(payload.new)
              }
            }
          } else if (payload.eventType === 'UPDATE') {
            // Mise à jour d'un message (streaming)
            const index = messagesRaw.value.findIndex((m) => m.id === payload.new.id)

            if (index !== -1) {
              // Préserver les documents existants lors de l'update
              const existingDocs = messagesRaw.value[index].documents || []
              messagesRaw.value[index] = {
                ...payload.new,
                documents: existingDocs
              }
            } else {
              messagesRaw.value.push(payload.new)
            }
          } else if (payload.eventType === 'DELETE') {
            // Suppression d'un message
            messagesRaw.value = messagesRaw.value.filter((m) => m.id !== payload.old.id)
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status)
      })

    return realtimeChannel.value
  }

  /**
   * Arrêter d'écouter les updates Realtime
   */
  const stopListening = () => {
    if (realtimeChannel.value) {
      realtimeChannel.value.unsubscribe()
      realtimeChannel.value = null
    }
  }

  /**
   * Écouter le streaming temps réel d'un message spécifique via Broadcast
   * Utilisé pour afficher les chunks de réponse en temps réel
   */
  const listenToMessageStream = (messageId) => {
    if (!messageId) {
      console.warn('⚠️ listenToMessageStream: messageId requis')
      return null
    }

    const channelName = `streaming-${messageId}`
    console.log(`📡 [FRONTEND] Création listener Broadcast pour channel: ${channelName}`)

    const streamChannel = supabase
      .channel(channelName)
      .on('broadcast', { event: 'message_chunk' }, (payload) => {
        console.log('📨 [FRONTEND] Chunk reçu via Broadcast:', payload)

        const data = payload.payload
        if (!data || !data.message_id) {
          console.warn('Payload Broadcast invalide:', payload)
          return
        }

        // Mettre à jour le message dans l'état local (modification directe pour réactivité)
        const index = messagesRaw.value.findIndex((m) => m.id === data.message_id)
        if (index !== -1) {
          // Modifier directement les propriétés pour déclencher la réactivité Vue
          messagesRaw.value[index].content = data.content
          messagesRaw.value[index].status = data.status
          messagesRaw.value[index].updated_at = data.updated_at
        } else {
          console.warn(`Message ${data.message_id} non trouvé dans l'état local`)
        }
      })
      .subscribe((status) => {
        console.log(
          `📡 [FRONTEND] Broadcast subscription status pour channel ${channelName}:`,
          status
        )

        if (status === 'SUBSCRIBED') {
          console.log(`✅ [FRONTEND] Prêt à recevoir les chunks pour ${messageId}`)

          // Timeout de sécurité: si aucun chunk reçu après 5 secondes, logger un warning
          setTimeout(() => {
            console.warn(
              `⚠️ [FRONTEND] Aucun chunk reçu après 5 secondes pour ${messageId}. Vérifier le backend.`
            )
          }, 5000)
        } else if (status === 'CHANNEL_ERROR') {
          console.error(`❌ [FRONTEND] Erreur de souscription Broadcast pour ${messageId}`)
        }
      })

    return streamChannel
  }

  /**
   * Générer un titre automatiquement avec l'IA
   */
  const generateTitle = async (conversationId) => {
    error.value = null

    try {
      const { title } = await $fetch(`/api/conversations/${conversationId}/rename`, {
        method: 'POST'
      })

      // Update local state
      const index = conversations.value.findIndex((c) => c.id === conversationId)
      if (index !== -1) {
        conversations.value[index].title = title
      }

      return title
    } catch (err) {
      error.value = err.data?.message || 'Failed to generate title'
      throw err
    }
  }

  /**
   * Mettre à jour le titre d'une conversation
   */
  const updateConversationTitle = async (conversationId, title) => {
    error.value = null

    try {
      await supabase.from('conversations').update({ title }).eq('id', conversationId)

      // Update local state
      const index = conversations.value.findIndex((c) => c.id === conversationId)
      if (index !== -1) {
        conversations.value[index].title = title
      }

      return title
    } catch (err) {
      error.value = err.message || 'Failed to update title'
      throw err
    }
  }

  /**
   * Soft delete une conversation
   */
  const deleteConversation = async (conversationId) => {
    error.value = null

    try {
      await $fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE'
      })

      // Remove from local state
      conversations.value = conversations.value.filter((c) => c.id !== conversationId)

      return true
    } catch (err) {
      error.value = err.data?.message || 'Failed to delete conversation'
      throw err
    }
  }

  /**
   * Restaurer une conversation supprimée
   */
  const restoreConversation = async (conversationId) => {
    error.value = null

    try {
      const { conversation } = await $fetch(`/api/conversations/${conversationId}/restore`, {
        method: 'POST'
      })

      // Add back to local state
      conversations.value.unshift(conversation)

      return conversation
    } catch (err) {
      error.value = err.data?.message || 'Failed to restore conversation'
      throw err
    }
  }

  /**
   * Nettoyer lors de la destruction du composable
   */
  onUnmounted(() => {
    stopListening()
  })

  return {
    // State
    conversations,
    currentConversation,
    messages,
    messagesRaw, // Export raw messages for direct manipulation
    loading,
    error,
    realtimeChannel,

    // Methods
    createConversation,
    fetchConversations,
    fetchMessages,
    sendMessage,
    generateTitle,
    updateConversationTitle,
    deleteConversation,
    restoreConversation,
    listenToConversation,
    listenToMessageStream,
    stopListening
  }
}
