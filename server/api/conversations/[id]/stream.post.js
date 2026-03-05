/**
 * Edge Runtime API Route: Stream LLM response avec SSE natif
 * POST /api/conversations/:id/stream
 *
 * Architecture Edge + SSE (Phase 2 - Recommended by Vercel 2024-2025):
 * 1. Vérifier crédits
 * 2. Créer messages (user + assistant)
 * 3. Stream SSE direct OpenRouter → Client
 * 4. Sauvegarder snapshots en DB périodiquement (pour historique)
 * 5. Client reçoit chunks en temps réel via SSE
 *
 * Avantages vs Node.js await:
 * - Pas de timeout (streaming continu)
 * - Latence réduite (pas de DB intermédiaire)
 * - Time-to-first-byte optimal
 */

// Edge Runtime configuration
import { createClient } from '@supabase/supabase-js'

export const config = {
  runtime: 'edge'
}

// Rate limiter simple pour Edge Runtime
// 10 requêtes de streaming par minute par utilisateur
const rateLimitStore = new Map()
const RATE_LIMIT_WINDOW = 60 * 1000 // 1 minute
const RATE_LIMIT_MAX = 10 // 10 streams par minute

function checkRateLimit(userId) {
  const now = Date.now()
  const userHits = rateLimitStore.get(userId) || []

  // Nettoyer les hits expirés
  const validHits = userHits.filter((timestamp) => now - timestamp < RATE_LIMIT_WINDOW)

  // Vérifier la limite
  if (validHits.length >= RATE_LIMIT_MAX) {
    const oldestHit = validHits[0]
    const retryAfter = Math.ceil((oldestHit + RATE_LIMIT_WINDOW - now) / 1000)
    return {
      allowed: false,
      retryAfter,
      remaining: 0
    }
  }

  // Ajouter le hit actuel
  validHits.push(now)
  rateLimitStore.set(userId, validHits)

  return {
    allowed: true,
    remaining: RATE_LIMIT_MAX - validHits.length,
    resetAt: now + RATE_LIMIT_WINDOW
  }
}

export default defineEventHandler(async (event) => {
  const conversationId = event.context.params.id

  // Edge runtime : pas d'accès à useRuntimeConfig(), utiliser process.env directement
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY
  const supabaseAdminKey = process.env.SUPABASE_ADMIN_KEY
  const openrouterApiKey = process.env.OPENROUTER_API_KEY

  if (!supabaseUrl || !supabaseAnonKey || !openrouterApiKey) {
    throw createError({
      statusCode: 500,
      message: 'Missing environment variables'
    })
  }

  // Client Supabase avec auth (pour vérifier user)
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Récupérer le token d'auth depuis les headers
  const authHeader = getRequestHeader(event, 'authorization')
  if (!authHeader) {
    throw createError({
      statusCode: 401,
      message: 'Missing authorization header'
    })
  }

  const {
    data: { user },
    error: authError
  } = await supabaseAuth.auth.getUser(authHeader.replace('Bearer ', ''))

  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Vérifier rate limit
  const rateLimitResult = checkRateLimit(user.id)
  if (!rateLimitResult.allowed) {
    throw createError({
      statusCode: 429,
      message: `Too many streaming requests. Please try again in ${rateLimitResult.retryAfter} seconds.`
    })
  }

  // Client Supabase admin (pour writes)
  const supabase = createClient(supabaseUrl, supabaseAdminKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })

  // Lire le body
  const body = await readBody(event)
  const { content, document_ids, locale = 'en' } = body

  if (!content || !content.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Message content is required'
    })
  }

  // Validate locale
  const userLocale = ['en', 'fr'].includes(locale) ? locale : 'en'

  // Vérifier crédits
  const { data: credits } = await supabase.rpc('get_user_credits', {
    p_user_id: user.id
  })

  const creditsRemaining = credits?.[0]?.credits_remaining || 0
  if (creditsRemaining <= 0) {
    throw createError({
      statusCode: 402,
      message: 'Insufficient credits'
    })
  }

  // Vérifier conversation
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, user_id, gpt_id, gpts(*)')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation || conversation.user_id !== user.id) {
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  // Créer message utilisateur
  const { data: userMessage, error: userMsgError } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      role: 'user',
      content: content.trim(),
      tokens_used: Math.ceil(content.length / 4), // Estimation rapide
      status: 'completed'
    })
    .select()
    .single()

  if (userMsgError || !userMessage) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create user message'
    })
  }

  // Lier les documents spécifiquement envoyés avec ce message
  if (document_ids && Array.isArray(document_ids) && document_ids.length > 0) {
    const messageDocuments = document_ids.map((docId) => ({
      message_id: userMessage.id,
      document_id: docId
    }))

    const { error: linkError } = await supabase.from('message_documents').insert(messageDocuments)

    if (linkError) {
      console.error('Error linking documents to message:', linkError)
      // Continue même si le linking échoue
    }
  }

  // Créer message assistant vide
  const { data: assistantMessage, error: assistMsgError } = await supabase
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

  if (assistMsgError || !assistantMessage) {
    throw createError({
      statusCode: 500,
      message: 'Failed to create assistant message'
    })
  }

  // Récupérer le contexte en parallèle
  const [messageHistoryResult, documentsResult, knowledgeFilesResult] = await Promise.all([
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
      .order('created_at', { ascending: true }),
    supabase
      .from('gpt_knowledge_files')
      .select('filename, extracted_text, word_count, estimated_tokens')
      .eq('gpt_id', conversation.gpts.id)
      .order('created_at', { ascending: true })
  ])

  const messageHistory = messageHistoryResult.data || []
  const documents = documentsResult.data || []
  const knowledgeFiles = knowledgeFilesResult.data || []

  // Combiner documents + knowledge base
  const allDocuments = [...documents, ...knowledgeFiles]

  // Préparer les messages
  const messages = messageHistory.map((m) => ({
    role: m.role,
    content: m.content
  }))

  // Injecter les documents au début du contexte si présents
  if (allDocuments.length > 0) {
    const documentsContext = allDocuments
      .map((doc) => {
        const preview = doc.extracted_text?.substring(0, 2000) || ''
        return `## Document: ${doc.filename}\nWord count: ${doc.word_count || 'N/A'}\n\n${preview}${doc.extracted_text?.length > 2000 ? '...[truncated]' : ''}`
      })
      .join('\n\n')

    messages.unshift({
      role: 'user',
      content: `The following documents are attached to this conversation for reference:\n\n${documentsContext}`
    })
  }

  // Build dynamic system prompt based on user locale
  const systemPromptByLocale = {
    fr: {
      intro:
        "Tu es un assistant IA professionnel spécialisé dans les achats et la gestion de la chaîne d'approvisionnement. Tu fais partie de CROWN, une plateforme dédiée aux acheteurs professionnels.",
      expertise: `Ton expertise couvre:
- La rédaction et l'analyse d'appels d'offres (RFP/RFQ)
- La comparaison et l'évaluation de réponses fournisseurs
- Les analyses professionnelles d'achats et de sourcing
- Les enchères électroniques et stratégies d'enchères
- Les négociations commerciales et contrats fournisseurs`,
      rules: `Règles importantes:
- TOUJOURS répondre en français, quelle que soit la langue de la question
- Rester concentré sur les problématiques d'achats professionnels et de procurement
- Refuser poliment les demandes hors du contexte professionnel des achats (ex: "Je suis spécialisé dans les achats professionnels. Pour cette demande, je vous suggère de consulter un assistant généraliste.")
- Être direct, professionnel et orienté solutions
- Ne pas répéter ton nom ou te présenter à nouveau si la conversation a déjà commencé
- Répondre de manière naturelle et contextuelle aux questions posées

IMPORTANT - Format de réponse:
Pour TOUTE comparaison, évaluation ou présentation de données structurées, utilise SYSTÉMATIQUEMENT un tableau markdown:
- Comparaisons de fournisseurs → tableau avec colonnes (Fournisseur, Prix, Délai, etc.)
- Grilles d'évaluation → tableau avec critères en lignes
- Analyses de prix → tableau comparatif
- Listes de produits/services → tableau structuré
Exemple:
| Critère | Fournisseur A | Fournisseur B |
|---------|--------------|--------------|
| Prix | 1000€ | 1200€ |

IMPORTANT - Mise en forme enrichie:
1. Sections avec emojis: Commence tes titres de sections (##) avec un emoji pertinent:
   - 💡 Recommandation/Conseils
   - 📋 Résumé
   - 📊 Analyse
   - ⚙️ Configuration/Paramètres
   - 📝 Détails
   - 💰 Tarification
   - 📅 Calendrier
   - ⏱️ Durée
   - 👥 Fournisseurs/Participants
   - ✅ Exigences
   - 📏 Règles
   - 🎯 Résultats/Stratégie
   - 🏆 Gagnant
   - ⚖️ Comparaison
   - 🔄 Options
   - ⚠️ Attention
   - ❗ Important
   - 📌 Note
   - 💼 Exemple

2. Termes clés en gras: Mets TOUJOURS en gras (**texte**) ces termes importants:
   - Types d'enchères: auction type, reverse auction, dutch auction, japanese auction, english auction, sealed bid
   - Paramètres: baseline, duration, ceiling price, floor price, decrement, increment, overtime, pre-bid
   - Concepts: line item, supplier, buyer, handicap, rank, total value, unit price, quantity`,
      role: 'Ton rôle spécifique:',
      defaultInstructions: 'Tu es un assistant spécialisé en achats et procurement.'
    },
    en: {
      intro:
        'You are a professional AI assistant specializing in procurement and supply chain management. You are part of CROWN, a platform dedicated to professional buyers.',
      expertise: `Your expertise covers:
- Writing and analyzing RFPs/RFQs (Requests for Proposal/Quotation)
- Comparing and evaluating supplier responses
- Professional procurement and sourcing analysis
- Electronic auctions and bidding strategies
- Commercial negotiations and supplier contracts`,
      rules: `Important rules:
- ALWAYS respond in English, regardless of the language of the question
- Stay focused on professional procurement issues
- Politely decline requests outside the professional procurement context (e.g., "I specialize in professional procurement. For this request, I suggest consulting a generalist assistant.")
- Be direct, professional, and solution-oriented
- Don't repeat your name or introduce yourself again if the conversation has already started
- Respond naturally and contextually to questions asked

IMPORTANT - Response Format:
For ANY comparison, evaluation, or structured data presentation, ALWAYS use markdown tables:
- Supplier comparisons → table with columns (Supplier, Price, Lead Time, etc.)
- Evaluation grids → table with criteria as rows
- Price analysis → comparative table
- Product/service lists → structured table
Example:
| Criteria | Supplier A | Supplier B |
|----------|------------|------------|
| Price | $1000 | $1200 |

IMPORTANT - Enhanced Formatting:
1. Sections with emojis: Start section headings (##) with a relevant emoji:
   - 💡 Recommendation/Tips
   - 📋 Summary
   - 📊 Analysis
   - ⚙️ Configuration/Settings
   - 📝 Details
   - 💰 Pricing
   - 📅 Timeline
   - ⏱️ Duration
   - 👥 Suppliers/Participants
   - ✅ Requirements
   - 📏 Rules
   - 🎯 Results/Strategy
   - 🏆 Winner
   - ⚖️ Comparison
   - 🔄 Options
   - ⚠️ Warning
   - ❗ Important
   - 📌 Note
   - 💼 Example

2. Key terms in bold: ALWAYS bold (**text**) these important terms:
   - Auction types: auction type, reverse auction, dutch auction, japanese auction, english auction, sealed bid
   - Parameters: baseline, duration, ceiling price, floor price, decrement, increment, overtime, pre-bid
   - Concepts: line item, supplier, buyer, handicap, rank, total value, unit price, quantity`,
      role: 'Your specific role:',
      defaultInstructions: 'You are an assistant specializing in procurement and purchasing.'
    }
  }

  const prompts = systemPromptByLocale[userLocale]
  const globalSystemPrompt = `${prompts.intro}

${prompts.expertise}

${prompts.rules}

${prompts.role}
${conversation.gpts.instructions || prompts.defaultInstructions}`

  // Appeler OpenRouter en streaming
  const modelToUse = conversation.gpts.recommended_model || 'openai/gpt-4-turbo'

  // Premium models that cost 2x credits
  const PREMIUM_MODELS = [
    'anthropic/claude-sonnet-4.5',
    'openai/o1',
    'openai/o1-pro',
    'openai/o3',
    'openai/gpt-5',
    'google/gemini-3-pro-preview',
    'x-ai/grok-3-mini'
  ]

  // Non-premium models that override the premium check (e.g., gpt-5.1-chat is cheaper than gpt-5)
  const NON_PREMIUM_OVERRIDE = ['openai/gpt-5.1-chat']

  // Models that support reasoning effort configuration
  const REASONING_MODELS = [
    'openai/o3',
    'openai/o1',
    'openai/o1-pro',
    'openai/gpt-5',
    'openai/gpt-5.1-chat',
    'anthropic/claude-sonnet-4.5',
    'google/gemini-2.5-pro',
    'google/gemini-3-pro-preview',
    'x-ai/grok-3-mini'
  ]

  // Models that expose reasoning tokens in the response
  // OpenAI models use reasoning internally but don't expose tokens
  const REASONING_VISIBLE_MODELS = [
    'anthropic/claude-sonnet-4.5',
    'google/gemini-2.5-pro',
    'google/gemini-3-pro-preview',
    'x-ai/grok-3-mini',
    'deepseek/deepseek-r1'
  ]

  // Check if current model is premium (but allow overrides for specific cheaper variants)
  const isNonPremiumOverride = NON_PREMIUM_OVERRIDE.some((npm) => modelToUse.includes(npm))
  const isPremiumModel =
    !isNonPremiumOverride && PREMIUM_MODELS.some((pm) => modelToUse.includes(pm))

  // Check if current model supports reasoning
  const supportsReasoning = REASONING_MODELS.some((rm) => modelToUse.includes(rm))

  // Check if current model exposes reasoning tokens in response
  // OpenAI models use reasoning internally but don't return tokens to the client
  const exposesReasoningTokens = REASONING_VISIBLE_MODELS.some((rm) => modelToUse.includes(rm))

  // For models that use reasoning but don't expose tokens, we'll simulate a "thinking" state
  // after 4 seconds to provide a consistent UX across all reasoning models
  const shouldSimulateThinking = supportsReasoning && !exposesReasoningTokens

  // Get reasoning effort from GPT settings (default to 'medium')
  const reasoningEffort = conversation.gpts.reasoning_effort || 'medium'

  // Build request body with optional reasoning config for supported models
  const requestBody = {
    model: modelToUse,
    messages: [
      {
        role: 'system',
        content: globalSystemPrompt
      },
      ...messages
    ],
    stream: true
  }

  // Add reasoning config for models that support it
  // Uses the reasoning_effort setting from the GPT configuration
  // IMPORTANT: include_reasoning: true is required to receive reasoning tokens in the response
  if (supportsReasoning) {
    requestBody.reasoning = {
      effort: reasoningEffort
    }
    // Request OpenRouter to include reasoning tokens in the streaming response
    requestBody.include_reasoning = true
  }

  const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${openrouterApiKey}`,
      'HTTP-Referer': process.env.VERCEL_URL || 'https://crown-app.vercel.app',
      'X-Title': 'Crown GPT'
    },
    body: JSON.stringify(requestBody)
  })

  if (!openRouterResponse.ok) {
    throw createError({
      statusCode: openRouterResponse.status,
      message: 'OpenRouter API error'
    })
  }

  // Créer un ReadableStream pour SSE
  let fullContent = ''
  let reasoningContent = '' // Track reasoning tokens separately
  let isReasoning = true // Start in reasoning phase for Gemini 2.5
  let lastDbUpdate = Date.now()
  const DB_UPDATE_INTERVAL = 2000 // 2s entre les snapshots DB
  const THINKING_DELAY = 4000 // 4s delay before showing simulated thinking
  let thinkingSignalSent = false // Track if we've sent the thinking signal
  let hasReceivedContent = false // Track if we've received any content
  const streamStartTime = Date.now() // Track when streaming started

  const stream = new ReadableStream({
    async start(controller) {
      const reader = openRouterResponse.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      try {
        while (true) {
          const { done, value } = await reader.read()

          // Check if we should send simulated thinking signal
          // This happens after 4s for models that use reasoning but don't expose tokens
          if (shouldSimulateThinking && !thinkingSignalSent && !hasReceivedContent) {
            const elapsed = Date.now() - streamStartTime
            if (elapsed >= THINKING_DELAY) {
              thinkingSignalSent = true
              controller.enqueue(`data: ${JSON.stringify({ type: 'thinking_started' })}\n\n`)
            }
          }

          if (done) {
            // Mise à jour finale
            await supabase
              .from('messages')
              .update({
                content: fullContent,
                status: 'completed',
                tokens_used: Math.ceil(fullContent.length / 4),
                updated_at: new Date().toISOString()
              })
              .eq('id', assistantMessage.id)

            // Déduire crédits (2x pour les modèles premium)
            const baseCredits = Math.ceil(fullContent.length / 4000)
            const creditsToDeduct = isPremiumModel ? baseCredits * 2 : baseCredits
            await supabase.rpc('deduct_user_credits', {
              p_user_id: user.id,
              p_amount: creditsToDeduct
            })

            controller.enqueue('data: [DONE]\n\n')
            controller.close()
            break
          }

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || ''

          for (const line of lines) {
            if (!line.trim() || !line.startsWith('data: ')) continue

            const dataStr = line.slice(6).trim()
            if (dataStr === '[DONE]') continue

            try {
              const data = JSON.parse(dataStr)
              const delta = data.choices?.[0]?.delta

              // Check for reasoning content (Gemini 2.5 thinking tokens)
              // OpenRouter may send reasoning in different fields depending on the model
              const reasoning =
                delta?.reasoning || delta?.reasoning_content || data.choices?.[0]?.reasoning_content
              const content = delta?.content

              // Send reasoning tokens to client during thinking phase
              if (reasoning) {
                reasoningContent += reasoning
                controller.enqueue(`data: ${JSON.stringify({ reasoning, type: 'reasoning' })}\n\n`)
              }

              // When we get actual content, reasoning phase is done
              if (content) {
                hasReceivedContent = true

                // Signal end of reasoning phase if we were reasoning
                if (isReasoning && reasoningContent) {
                  isReasoning = false
                  controller.enqueue(`data: ${JSON.stringify({ type: 'reasoning_complete' })}\n\n`)
                }

                // Signal end of simulated thinking phase if we sent it
                if (thinkingSignalSent) {
                  controller.enqueue(`data: ${JSON.stringify({ type: 'thinking_complete' })}\n\n`)
                  thinkingSignalSent = false // Reset so we don't send it again
                }

                fullContent += content

                // Envoyer au client via SSE
                controller.enqueue(`data: ${JSON.stringify({ content, type: 'content' })}\n\n`)

                // Sauvegarder snapshot en DB périodiquement
                const now = Date.now()
                if (now - lastDbUpdate > DB_UPDATE_INTERVAL) {
                  await supabase
                    .from('messages')
                    .update({
                      content: fullContent,
                      updated_at: new Date().toISOString()
                    })
                    .eq('id', assistantMessage.id)
                  lastDbUpdate = now
                }
              }
            } catch (err) {
              console.error('SSE parse error:', err)
            }
          }
        }
      } catch (error) {
        console.error('Stream error:', error)
        await supabase
          .from('messages')
          .update({
            status: 'failed',
            content: fullContent || 'Stream error occurred',
            updated_at: new Date().toISOString()
          })
          .eq('id', assistantMessage.id)

        controller.error(error)
      }
    }
  })

  // Retourner le stream SSE
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive'
    }
  })
})
