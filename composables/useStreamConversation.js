/**
 * Composable pour utiliser le streaming SSE Edge (Phase 2)
 *
 * Usage:
 * const { sendMessage, isStreaming, error } = useStreamConversation()
 * await sendMessage(conversationId, content, onChunk)
 */

export const useStreamConversation = () => {
  const isStreaming = ref(false)
  const error = ref(null)

  /**
   * Envoyer un message avec streaming SSE
   * @param {string} conversationId - ID de la conversation
   * @param {string} content - Contenu du message
   * @param {function} onChunk - Callback appelé pour chaque chunk: (content) => void
   * @returns {Promise<void>}
   */
  const sendMessage = async (conversationId, content, onChunk) => {
    isStreaming.value = true
    error.value = null

    try {
      const supabase = useSupabaseClient()
      const {
        data: { session }
      } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('Not authenticated')
      }

      // Appeler l'endpoint Edge SSE
      const response = await fetch(`/api/conversations/${conversationId}/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ content })
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Stream failed: ${response.status} ${errorText}`)
      }

      // Lire le stream SSE
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()

        if (done) {
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue

          const dataStr = line.slice(6).trim()
          if (dataStr === '[DONE]') {
            break
          }

          try {
            const data = JSON.parse(dataStr)
            if (data.content && onChunk) {
              onChunk(data.content)
            }
          } catch (err) {
            console.error('Failed to parse SSE data:', err)
          }
        }
      }
    } catch (err) {
      console.error('Stream error:', err)
      error.value = err.message
      throw err
    } finally {
      isStreaming.value = false
    }
  }

  return {
    sendMessage,
    isStreaming,
    error
  }
}
