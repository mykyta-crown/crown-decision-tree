/**
 * Stream Worker - Gestion asynchrone du streaming OpenRouter
 *
 * Ce worker consomme le stream SSE d'OpenRouter et met à jour Supabase
 * progressivement. Supabase Realtime notifie ensuite automatiquement le client.
 */

import { callOpenRouterStream, calculateTokens } from './openrouter.js'
import { createClient } from '@supabase/supabase-js'
import { formatDocumentForAI } from './documentFormatter.js'

const WORKER_TIMEOUT = 5 * 60 * 1000 // 5 minutes
const MAX_RETRIES = 3
const UPDATE_THROTTLE = 300 // 300ms = ~3 updates/sec (réduit charge DB, toujours fluide pour l'user)
const BROADCAST_ENABLED = false // Utiliser postgres_changes au lieu de Broadcast (plus fiable en Edge Runtime)
const MIN_CONTENT_LENGTH_FOR_UPDATE = 10 // Ne pas update si moins de 10 nouveaux caractères

/**
 * Fonction utilitaire pour attendre (pour retry avec backoff)
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * Parse une ligne SSE et extrait le contenu
 */
function parseSSELine(line) {
  if (!line.startsWith('data: ')) return null

  const dataStr = line.slice(6).trim()
  if (dataStr === '[DONE]') return { done: true }

  try {
    const data = JSON.parse(dataStr)

    // OpenRouter retourne usage à la fin du stream
    const usage = data.usage || {}

    return {
      done: false,
      content: data.choices?.[0]?.delta?.content || '',
      promptTokens: usage.prompt_tokens || 0,
      completionTokens: usage.completion_tokens || 0,
      totalTokens: usage.total_tokens || 0
    }
  } catch (error) {
    console.error('Failed to parse SSE line:', error)
    return null
  }
}

/**
 * Démarre un worker asynchrone pour traiter le streaming OpenRouter
 *
 * @param {string} messageId - ID du message assistant à mettre à jour
 * @param {string} conversationId - ID de la conversation
 * @param {string} userId - ID de l'utilisateur (pour déduction crédits)
 * @returns {Promise<void>}
 */
export async function startStreamWorker(messageId, conversationId, userId) {
  // FIRST THING: Log synchronously to prove function was called
  console.log('🚀 [WORKER] Function startStreamWorker() CALLED', {
    messageId,
    conversationId,
    userId,
    timestamp: new Date().toISOString()
  })

  const startTime = Date.now()
  const workerTimings = {}

  console.log('🔍 [DEBUG] Step 1: Worker function entered')

  // Créer une promesse de timeout
  const timeoutPromise = new Promise((_, reject) => {
    setTimeout(() => reject(new Error('Worker timeout')), WORKER_TIMEOUT)
  })

  try {
    // Exécuter le worker avec timeout
    await Promise.race([
      actualStreamWorker(messageId, conversationId, userId, workerTimings),
      timeoutPromise
    ])

    const duration = Date.now() - startTime
    workerTimings.totalWorker = duration
    console.log('✅ Worker completed', {
      messageId,
      duration,
      timings: workerTimings,
      timestamp: new Date().toISOString()
    })

    return workerTimings
  } catch (error) {
    const duration = Date.now() - startTime
    console.error('❌ Worker failed', {
      messageId,
      error: error.message,
      duration,
      timestamp: new Date().toISOString()
    })

    // Extraire un message d'erreur user-friendly
    let userMessage = 'Generation failed. Please try again.'

    if (error.message.includes('402')) {
      // Parse the error to check if it was about token limits or actual credits
      if (error.message.includes('can only afford')) {
        const match = error.message.match(/can only afford (\d+)/)
        const affordableTokens = match ? match[1] : 'fewer'
        userMessage = `⚠️ OpenRouter API has low credits (can only afford ${affordableTokens} tokens). The system attempted to generate a response with available tokens, but it may be incomplete. Please add more credits to OpenRouter: https://openrouter.ai/settings/credits`
      } else {
        userMessage =
          '⚠️ Insufficient OpenRouter API credits. Please add credits at https://openrouter.ai/settings/credits'
      }
    } else if (error.message.includes('401')) {
      userMessage = '⚠️ API authentication failed. Please contact support.'
    } else if (error.message.includes('rate limit')) {
      userMessage = '⚠️ Too many requests. Please wait a moment and try again.'
    } else if (error.message.includes('timeout')) {
      userMessage = '⚠️ Request timed out. Please try again with a shorter message.'
    }

    // Marquer le message comme failed avec le vrai message d'erreur
    const supabase = useSupabaseServiceClient()
    await supabase
      .from('messages')
      .update({
        status: 'failed',
        content: userMessage,
        updated_at: new Date().toISOString()
      })
      .eq('id', messageId)
  }
}

/**
 * Implémentation réelle du worker (avec retry logic)
 */
async function actualStreamWorker(messageId, conversationId, userId, workerTimings = {}) {
  console.log('🔍 [DEBUG] Step 2: actualStreamWorker entered')

  // 🧪 TEST : Forcer une erreur pour tester l'affichage des messages d'erreur
  // Décommentez une des lignes ci-dessous pour tester les messages d'erreur :
  // throw new Error('402: This request requires more credits, or fewer max_tokens.')
  // throw new Error('401: Unauthorized - Invalid API key')
  // throw new Error('rate limit exceeded')
  // throw new Error('timeout occurred')

  const supabase = useSupabaseServiceClient()
  console.log('🔍 [DEBUG] Step 3: Supabase client created')

  // 1. Récupérer le contexte en parallèle pour réduire la latence
  console.log('🔍 [DEBUG] Step 4: Fetching all data in parallel')
  const fetchStart = Date.now()

  const [conversationResult, messageHistoryResult, documentsResult] = await Promise.all([
    supabase.from('conversations').select('*, gpts(*)').eq('id', conversationId).single(),
    supabase
      .from('messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .eq('status', 'completed')
      .order('created_at', { ascending: true }),
    supabase
      .from('documents')
      .select('filename, extracted_text, word_count, estimated_tokens')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
  ])

  workerTimings.parallelFetch = Date.now() - fetchStart

  // Vérifier conversation
  const { data: conversation, error: convError } = conversationResult
  if (convError || !conversation) {
    console.error('❌ [DEBUG] Failed to fetch conversation:', convError)
    throw new Error(`Failed to fetch conversation: ${convError?.message}`)
  }

  // Vérifier messages
  const { data: messageHistory, error: msgError } = messageHistoryResult
  if (msgError) {
    console.error('❌ [DEBUG] Failed to fetch message history:', msgError)
    throw new Error(`Failed to fetch message history: ${msgError.message}`)
  }

  // Documents (optionnel)
  const { data: documents, error: docsError } = documentsResult
  if (docsError) {
    console.warn('⚠️ Failed to fetch documents:', docsError.message)
  }

  console.log(
    `✅ [DEBUG] Step 5: All data fetched (${messageHistory?.length || 0} messages, ${documents?.length || 0} docs)`
  )

  // 2. Récupérer les fichiers de connaissance du GPT (séparément car dépend de conversation.gpts.id)
  console.log('🔍 [DEBUG] Step 5.5: Fetching knowledge files')
  const knowledgeStart = Date.now()
  const { data: knowledgeFiles, error: knowledgeError } = await supabase
    .from('gpt_knowledge_files')
    .select('filename, extracted_text, word_count, estimated_tokens')
    .eq('gpt_id', conversation.gpts.id)
    .order('created_at', { ascending: true })
  workerTimings.fetchKnowledge = Date.now() - knowledgeStart

  if (knowledgeError) {
    console.warn('⚠️ Failed to fetch GPT knowledge files:', knowledgeError.message)
  }
  console.log(`✅ [DEBUG] Step 5.6: Knowledge files fetched (${knowledgeFiles?.length || 0} files)`)

  // Combiner les documents de conversation et les fichiers de connaissance
  console.log('🔍 [DEBUG] Step 5.7: Combining documents')
  const allDocuments = [...(documents || []), ...(knowledgeFiles || [])]
  console.log(`✅ [DEBUG] Step 5.8: Combined ${allDocuments.length} total documents`)

  // 3. Préparer les messages pour OpenRouter
  console.log('🔍 [DEBUG] Step 5.9: Preparing messages for OpenRouter')
  const messages = messageHistory.map((m) => ({
    role: m.role,
    content: m.content
  }))
  console.log(`✅ [DEBUG] Step 5.10: Messages prepared (${messages.length} messages)`)

  // 3.5. Injecter les documents au début du contexte si présents
  if (allDocuments && allDocuments.length > 0) {
    const conversationDocsCount = documents?.length || 0
    const knowledgeFilesCount = knowledgeFiles?.length || 0

    console.log(
      `📎 Including ${allDocuments.length} document(s) in context (${conversationDocsCount} conversation docs + ${knowledgeFilesCount} knowledge files)`
    )

    // Créer un message système avec les documents
    const documentsContext = allDocuments
      .map((doc) => formatDocumentForAI(doc.filename, doc.extracted_text, doc.word_count))
      .join('\n\n')

    // Ajouter au début des messages (après le system prompt mais avant les messages utilisateur)
    messages.unshift({
      role: 'user',
      content: `The following documents are attached to this conversation for reference:\n\n${documentsContext}`
    })

    const totalDocTokens = allDocuments.reduce((sum, doc) => sum + (doc.estimated_tokens || 0), 0)
    console.log(
      `📊 Document tokens: ${totalDocTokens} tokens from ${allDocuments.length} document(s)`
    )
  }

  // 4. Appeler OpenRouter avec retry logic et fallback model
  console.log('🔍 [DEBUG] Step 6: Calling OpenRouter')
  const openRouterStart = Date.now()
  let response
  let modelToUse = conversation.gpts.recommended_model
  let modelFallbackUsed = false
  console.log('🔍 [DEBUG] Model to use:', modelToUse)

  // Liste des modèles invalides connus (Gemini old models)
  const invalidModels = [
    'google/gemini-pro',
    'google/gemini-pro-1.5',
    'google/gemini-pro-vision',
    'google/gemini-2.0-flash-001',
    'google/gemini-flash-1.5'
  ]

  // Si le modèle est dans la liste des invalides, utiliser un fallback immédiatement
  if (invalidModels.includes(modelToUse)) {
    console.warn(
      `⚠️ Model ${modelToUse} is known to be invalid, using fallback: openai/gpt-4-turbo`
    )
    modelToUse = 'openai/gpt-4-turbo'
    modelFallbackUsed = true
  }

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      console.log(`🔍 [DEBUG] OpenRouter attempt ${attempt}/${MAX_RETRIES}`)
      response = await callOpenRouterStream({
        model: modelToUse,
        messages: messages,
        systemPrompt: conversation.gpts.instructions
      })
      console.log('✅ [DEBUG] Step 7: OpenRouter response received')
      break // Succès, sortir de la boucle
    } catch (error) {
      console.error(`❌ [DEBUG] OpenRouter attempt ${attempt} failed:`, error.message)
      // Si erreur 400 ou 404 (model not found/invalid), essayer avec un fallback
      if (
        !modelFallbackUsed &&
        (error.message.includes('400') ||
          error.message.includes('404') ||
          error.message.includes('not a valid model'))
      ) {
        console.warn(
          `⚠️ Model ${modelToUse} failed with invalid model error, using fallback: openai/gpt-4-turbo`
        )
        modelToUse = 'openai/gpt-4-turbo'
        modelFallbackUsed = true
        continue // Réessayer avec le nouveau modèle sans incrémenter attempt
      }

      if (attempt === MAX_RETRIES) {
        throw error
      }
      // Backoff exponentiel: 2s, 4s, 8s
      const delay = Math.pow(2, attempt) * 1000
      console.warn(`⚠️ Attempt ${attempt} failed, retrying in ${delay}ms...`)
      await sleep(delay)
    }
  }
  workerTimings.openRouterCall = Date.now() - openRouterStart

  // 5. Consommer le stream chunk par chunk
  const streamStart = Date.now()
  const reader = response.body.getReader()
  const decoder = new TextDecoder()
  let fullContent = ''
  let promptTokens = 0
  let completionTokens = 0
  let totalTokens = 0
  let lastUpdate = Date.now()
  let lastContentLength = 0
  let buffer = ''
  let firstTokenTime = null

  // 5.5. Setup Broadcast channel pour streaming temps réel (si activé)
  console.log('🔍 [DEBUG] Step 8: Setting up Broadcast channel')
  let broadcastChannel = null
  if (BROADCAST_ENABLED) {
    try {
      console.log('🔍 [DEBUG] BROADCAST_ENABLED is true')
      const supabaseBroadcast = useSupabaseServiceClient()
      const channelName = `streaming-${messageId}`
      console.log('🔍 [DEBUG] Creating channel:', channelName)
      broadcastChannel = supabaseBroadcast.channel(channelName)

      await broadcastChannel.subscribe()
      console.log(`✅ [BACKEND] Broadcast channel créé et souscrit: ${channelName}`)
      console.log('✅ [DEBUG] Step 9: Broadcast channel ready')
    } catch (error) {
      console.error('❌ [BACKEND] Erreur création Broadcast channel:', error)
      broadcastChannel = null
      // Continue sans Broadcast (fallback sur DB updates)
    }
  } else {
    console.log('📡 [BACKEND] Broadcast désactivé, utilisation de postgres_changes uniquement')
  }

  console.log('🔍 [DEBUG] Step 10: Starting streaming loop')
  let chunkCount = 0

  while (true) {
    const { done, value } = await reader.read()
    if (done) {
      console.log(`🔍 [DEBUG] Streaming done. Total chunks processed: ${chunkCount}`)
      break
    }

    chunkCount++
    if (chunkCount === 1) {
      console.log('🔍 [DEBUG] First chunk received from OpenRouter')
    }

    // Décoder le chunk
    const chunk = decoder.decode(value, { stream: true })
    buffer += chunk

    // Parser les lignes complètes
    const lines = buffer.split('\n')
    buffer = lines.pop() || '' // Garder la dernière ligne incomplète

    for (const line of lines) {
      if (!line.trim()) continue

      const parsed = parseSSELine(line)
      if (!parsed) continue

      if (parsed.done) {
        break
      }

      if (parsed.content) {
        fullContent += parsed.content
        // Track time to first token
        if (!firstTokenTime) {
          firstTokenTime = Date.now()
          workerTimings.timeToFirstToken = firstTokenTime - streamStart
        }
      }

      // Capturer les tokens réels d'OpenRouter
      if (parsed.totalTokens > 0) {
        promptTokens = parsed.promptTokens
        completionTokens = parsed.completionTokens
        totalTokens = parsed.totalTokens
        console.log('📊 Tokens from OpenRouter:', { promptTokens, completionTokens, totalTokens })
      }

      // Throttling: envoyer les updates seulement si assez de contenu accumulé
      const now = Date.now()
      const contentSinceLastUpdate = fullContent.length - (lastContentLength || 0)

      if (
        now - lastUpdate >= UPDATE_THROTTLE &&
        contentSinceLastUpdate >= MIN_CONTENT_LENGTH_FOR_UPDATE
      ) {
        lastContentLength = fullContent.length

        if (BROADCAST_ENABLED && broadcastChannel) {
          // Envoyer via Broadcast (temps réel, pas de DB write)
          try {
            const payload = {
              message_id: messageId,
              content: fullContent,
              status: 'generating',
              updated_at: new Date().toISOString()
            }

            // Utiliser httpSend pour forcer REST API (plus fiable que WebSocket sur Vercel)
            const sendMethod =
              typeof broadcastChannel.httpSend === 'function'
                ? broadcastChannel.httpSend.bind(broadcastChannel)
                : broadcastChannel.send.bind(broadcastChannel)

            const result = await sendMethod({
              type: 'broadcast',
              event: 'message_chunk',
              payload: payload
            })

            console.log(
              `📤 [BACKEND] Chunk envoyé via Broadcast (${fullContent.length} chars), result:`,
              result
            )
          } catch (error) {
            console.error('❌ [BACKEND] Erreur envoi Broadcast:', error)
            // Fallback: update DB si Broadcast échoue
            await supabase
              .from('messages')
              .update({
                content: fullContent,
                updated_at: new Date().toISOString()
              })
              .eq('id', messageId)
          }
        } else {
          // Fallback: update DB directement (comportement original)
          await supabase
            .from('messages')
            .update({
              content: fullContent,
              updated_at: new Date().toISOString()
            })
            .eq('id', messageId)
        }

        lastUpdate = now
      }
    }
  }
  workerTimings.streamProcessing = Date.now() - streamStart

  // 6. Si un modèle de fallback a été utilisé, ajouter un avertissement
  if (modelFallbackUsed) {
    const fallbackWarning = `\n\n---\n⚠️ **Note**: The configured model (${conversation.gpts.recommended_model}) is no longer supported by OpenRouter. A fallback model (${modelToUse}) was used instead. Please update your GPT configuration to use a supported model.`
    fullContent = fullContent + fallbackWarning
  }

  // 7. Mise à jour finale avec status completed
  // Si on n'a pas reçu de tokens d'OpenRouter, estimer (fallback)
  if (!totalTokens) {
    console.warn('⚠️ No tokens from OpenRouter, using estimation fallback')

    // Estimer les tokens du prompt (historique + system prompt)
    const systemPromptTokens = calculateTokens(conversation.gpts.instructions || '')
    const historyTokens = messages.reduce((sum, m) => sum + calculateTokens(m.content || ''), 0)
    promptTokens = systemPromptTokens + historyTokens

    // Estimer les tokens de la réponse
    completionTokens = calculateTokens(fullContent)
    totalTokens = promptTokens + completionTokens

    console.log('📊 Estimated tokens:', { promptTokens, completionTokens, totalTokens })
  }

  const finalUpdateStart = Date.now()
  await supabase
    .from('messages')
    .update({
      content: fullContent,
      status: 'completed',
      tokens_used: totalTokens, // Total = prompt + completion (correspond aux crédits déduits)
      updated_at: new Date().toISOString()
    })
    .eq('id', messageId)
  workerTimings.finalUpdate = Date.now() - finalUpdateStart

  // 7. Déduire les crédits basé sur les VRAIS tokens (1 crédit = 1000 tokens)
  const creditsToDeduct = Math.ceil(totalTokens / 1000)

  console.log('💰 Credit calculation:', {
    promptTokens,
    completionTokens,
    totalTokens,
    creditsToDeduct,
    userId
  })

  const creditStart = Date.now()
  const { error: deductError } = await supabase.rpc('deduct_user_credits', {
    p_user_id: userId,
    p_amount: creditsToDeduct
  })
  workerTimings.creditDeduction = Date.now() - creditStart

  if (deductError) {
    console.error('❌ Failed to deduct credits:', deductError)
    // Ne pas échouer le worker pour une erreur de crédit
  } else {
    console.log(`✅ Credits deducted: ${creditsToDeduct} credits for ${totalTokens} tokens`)
  }

  // 8. Cleanup: fermer le Broadcast channel
  if (broadcastChannel) {
    try {
      await broadcastChannel.unsubscribe()
      console.log(`📡 Broadcast channel fermé: streaming-${messageId}`)
    } catch (error) {
      console.error('❌ Erreur fermeture Broadcast channel:', error)
    }
  }
}

/**
 * Fonction utilitaire pour créer un client Supabase service
 * (avec droits admin pour bypass RLS dans le worker)
 */
function useSupabaseServiceClient() {
  const config = useRuntimeConfig()

  return createClient(
    config.public.supabaseUrl,
    config.supabaseAdminKey, // Clé service/admin (pas la clé publique anon)
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
