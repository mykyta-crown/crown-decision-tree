import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Envoyer un message dans une conversation
 * POST /api/conversations/:id/send
 *
 * Body: { content: string }
 *
 * Architecture Worker Asynchrone:
 * 1. Vérifier crédits
 * 2. Créer message utilisateur
 * 3. Créer message assistant vide (status: generating)
 * 4. Lancer worker asynchrone (ne bloque PAS)
 * 5. Retourner immédiatement {message_id, status: 'generating'}
 * 6. Client écoute Supabase Realtime pour updates
 */

import { startStreamWorker } from '~/server/utils/streamWorker.js'
import { calculateTokens } from '~/server/utils/openrouter.js'
import { logDeploymentContext } from '~/server/utils/deployDiagnostics.js'

export default defineEventHandler(async (event) => {
  const startTime = Date.now()
  const timings = {}

  const supabase = await serverSupabaseClient(event)
  const conversationId = event.context.params.id

  logDeploymentContext(event, 'conversation-send')
  timings.init = Date.now() - startTime

  // Vérifier l'authentification
  const authStart = Date.now()
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()
  timings.auth = Date.now() - authStart

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Lire le contenu du message
  const body = await readBody(event)
  const { content, document_ids } = body

  if (!content || !content.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Message content is required'
    })
  }

  // 1. Vérifier les crédits disponibles
  const creditsStart = Date.now()
  const { data: credits } = await supabase.rpc('get_user_credits', {
    p_user_id: user.id
  })
  timings.credits = Date.now() - creditsStart

  const creditsRemaining = credits?.[0]?.credits_remaining || 0

  if (creditsRemaining <= 0) {
    throw createError({
      statusCode: 402,
      message: 'Insufficient credits'
    })
  }

  // Vérifier que la conversation existe et appartient à l'utilisateur
  const convStart = Date.now()
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, user_id, gpt_id')
    .eq('id', conversationId)
    .single()
  timings.conversationCheck = Date.now() - convStart

  if (convError || !conversation || conversation.user_id !== user.id) {
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  // 2. Sauvegarder le message utilisateur
  const userTokens = calculateTokens(content)

  const userMsgStart = Date.now()
  const { data: userMessage, error: userMsgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: content.trim(),
      tokens_used: userTokens,
      status: 'completed'
    })
    .select()
    .single()
  timings.userMessage = Date.now() - userMsgStart

  if (userMsgError || !userMessage) {
    console.error('Error creating user message:', userMsgError)
    throw createError({
      statusCode: 500,
      message: 'Failed to create user message'
    })
  }

  // 2.5. Lier les documents spécifiquement envoyés avec ce message
  if (document_ids && Array.isArray(document_ids) && document_ids.length > 0) {
    const messageDocuments = document_ids.map((docId) => ({
      message_id: userMessage.id,
      document_id: docId
    }))

    const { error: linkError } = await supabase.from('message_documents').insert(messageDocuments)

    if (linkError) {
      console.error('Error linking documents to message:', linkError)
      // Continue even if linking fails - don't block the message
    }
  }

  // 3. Créer un message assistant VIDE (status: generating)
  const assistMsgStart = Date.now()
  const { data: assistantMessage, error: msgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'assistant',
      content: '',
      status: 'generating',
      tokens_used: 0
    })
    .select()
    .single()
  timings.assistantMessage = Date.now() - assistMsgStart

  if (msgError || !assistantMessage) {
    console.error('Error creating assistant message:', msgError)
    throw createError({
      statusCode: 500,
      message: 'Failed to create message'
    })
  }

  // 4. Lancer le worker (Node.js runtime - meilleures perfs DB qu'Edge)
  const workerStart = Date.now()

  console.log('🔍 [DEBUG] Starting stream worker for message:', assistantMessage.id)

  // Attendre le worker (Node.js runtime supporte les longues durées)
  // Le streaming se fait via database updates que le client reçoit en temps réel
  try {
    await startStreamWorker(assistantMessage.id, conversationId, user.id)
    console.log('✅ [DEBUG] Worker completed successfully')
  } catch (error) {
    console.error('❌ Worker execution error:', error)
    console.error('❌ Worker error stack:', error.stack)
  }

  timings.worker = Date.now() - workerStart
  timings.total = Date.now() - startTime

  try {
    // Gather deployment context
    const headers = getRequestHeaders(event) || {}
    const deploymentInfo = {
      vercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      nitroPreset: process.env.NITRO_PRESET,
      edgeRuntime: process.env.NEXT_RUNTIME || process.env.NITRO_EDGE,
      requestRegion: headers['x-vercel-id']?.split(':')?.[0]
    }

    // 5. Retourner immédiatement (le worker tourne en arrière-plan)
    return {
      success: true,
      message_id: assistantMessage.id,
      status: 'generating',
      message: 'Generation started. Subscribe to Broadcast for real-time updates.',
      debug: {
        timings,
        deployment: deploymentInfo
      }
    }
  } catch (error) {
    console.error('❌ Worker error (caught in send route):', error)
    timings.total = Date.now() - startTime
    // Le worker a déjà marqué le message comme 'failed'

    return {
      success: false,
      message_id: assistantMessage.id,
      status: 'failed',
      message: 'Generation failed. Please check the message for details.',
      debug: {
        timings
      }
    }
  }
})
