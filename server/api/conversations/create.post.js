import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Créer une nouvelle conversation
 * POST /api/conversations/create
 *
 * Body: { gpt_id: string, title?: string }
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

  // Vérifier l'authentification
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()
  if (authError || !user) {
    throw createError({
      statusCode: 401,
      message: 'Unauthorized'
    })
  }

  // Lire les données du body
  const body = await readBody(event)
  const { gpt_id, title = 'New conversation', locale = 'en' } = body

  // Validate locale
  const userLocale = ['en', 'fr'].includes(locale) ? locale : 'en'

  if (!gpt_id) {
    throw createError({
      statusCode: 400,
      message: 'Missing required field: gpt_id'
    })
  }

  // Vérifier que l'utilisateur a accès au GPT
  const { data: gpt, error: gptError } = await supabase
    .from('gpts')
    .select('id, name, description, instructions, conversation_starters')
    .eq('id', gpt_id)
    .single()

  if (gptError || !gpt) {
    throw createError({
      statusCode: 404,
      message: 'GPT not found or access denied'
    })
  }

  // Créer la conversation
  const { data: conversation, error } = await supabase
    .from('conversations')
    .insert({
      gpt_id,
      user_id: user.id,
      title: title || `Chat with ${gpt.name}`
    })
    .select('*, gpts(*)')
    .single()

  if (error) {
    console.error('Error creating conversation:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create conversation'
    })
  }

  // Générer automatiquement un message d'accueil personnalisé via l'IA
  try {
    const config = useRuntimeConfig()
    const openrouterApiKey = config.openrouterApiKey

    // Construire le system prompt pour le message d'accueil selon la langue
    const conversationStartersContext =
      gpt.conversation_starters && gpt.conversation_starters.length > 0
        ? `\n\nExample topics you can handle:\n${gpt.conversation_starters.map((s) => `- ${s}`).join('\n')}`
        : ''

    // Language-specific welcome prompt templates
    const welcomePromptByLocale = {
      fr: {
        systemPrompt: `Tu es ${gpt.name}.

${gpt.instructions || 'Tu es un assistant spécialisé en achats et procurement.'}${conversationStartersContext}

IMPORTANT: Tu dois générer un message d'accueil en EXACTEMENT DEUX PHRASES EN FRANÇAIS :

Première phrase : Salutation chaleureuse avec un emoji 👋 après "Bonjour" + présentation de qui tu es et de ton rôle spécifique.
Deuxième phrase : Donner des exemples concrets de questions ou sujets que l'utilisateur peut te poser (inspirés des exemples ci-dessus si disponibles).

Format requis : Ajouter un retour à la ligne entre les deux phrases pour aérer le texte.

Le message doit être professionnel, accueillant et en FRANÇAIS.
Ne génère QUE le message d'accueil, rien d'autre.`,
        userPrompt: "Génère ton message d'accueil en français.",
        defaultGreeting: 'Bonjour 👋',
        defaultDescription: 'votre assistant spécialisé',
        defaultExample:
          gpt.conversation_starters && gpt.conversation_starters.length > 0
            ? `Par exemple, je peux vous aider avec : ${gpt.conversation_starters[0].toLowerCase()}.`
            : "Comment puis-je vous assister aujourd'hui ?"
      },
      en: {
        systemPrompt: `You are ${gpt.name}.

${gpt.instructions || 'You are an assistant specializing in procurement and purchasing.'}${conversationStartersContext}

IMPORTANT: You must generate a welcome message in EXACTLY TWO SENTENCES IN ENGLISH:

First sentence: Warm greeting with an emoji 👋 after "Hello" + introduction of who you are and your specific role.
Second sentence: Give concrete examples of questions or topics the user can ask you about (inspired by the examples above if available).

Required format: Add a line break between the two sentences for readability.

The message must be professional, welcoming and in ENGLISH.
Generate ONLY the welcome message, nothing else.`,
        userPrompt: 'Generate your welcome message in English.',
        defaultGreeting: 'Hello 👋',
        defaultDescription: 'your specialized assistant',
        defaultExample:
          gpt.conversation_starters && gpt.conversation_starters.length > 0
            ? `For example, I can help you with: ${gpt.conversation_starters[0].toLowerCase()}.`
            : 'How can I assist you today?'
      }
    }

    const prompts = welcomePromptByLocale[userLocale]

    // Appeler OpenRouter pour générer le message d'accueil
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'https://crown-app.vercel.app',
        'X-Title': 'Crown GPT'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: prompts.systemPrompt
          },
          {
            role: 'user',
            content: prompts.userPrompt
          }
        ],
        temperature: 0.9, // Plus de créativité pour varier les accroches
        max_tokens: 150
      })
    })

    // Message par défaut selon la langue
    let welcomeMessage = `${prompts.defaultGreeting}, ${userLocale === 'fr' ? 'je suis' : 'I am'} ${gpt.name}, ${gpt.description || prompts.defaultDescription}.\n\n${prompts.defaultExample}`

    if (openRouterResponse.ok) {
      const data = await openRouterResponse.json()
      const generatedMessage = data.choices?.[0]?.message?.content?.trim()
      if (generatedMessage) {
        welcomeMessage = generatedMessage
      }
    }

    // Créer le message d'introduction de l'assistant
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: welcomeMessage,
      status: 'completed',
      tokens_used: Math.ceil(welcomeMessage.length / 4)
    })
  } catch (error) {
    console.error('Error generating welcome message:', error)
    // En cas d'erreur, créer un message d'accueil par défaut selon la langue
    const fallbackByLocale = {
      fr: {
        greeting: 'Bonjour 👋',
        intro: 'je suis',
        defaultDesc: 'votre assistant spécialisé',
        example:
          gpt.conversation_starters && gpt.conversation_starters.length > 0
            ? `Par exemple, je peux vous aider avec : ${gpt.conversation_starters[0].toLowerCase()}.`
            : "Comment puis-je vous assister aujourd'hui ?"
      },
      en: {
        greeting: 'Hello 👋',
        intro: 'I am',
        defaultDesc: 'your specialized assistant',
        example:
          gpt.conversation_starters && gpt.conversation_starters.length > 0
            ? `For example, I can help you with: ${gpt.conversation_starters[0].toLowerCase()}.`
            : 'How can I assist you today?'
      }
    }

    const fallback = fallbackByLocale[userLocale]
    const fallbackMessage = `${fallback.greeting}, ${fallback.intro} ${gpt.name}, ${gpt.description || fallback.defaultDesc}.\n\n${fallback.example}`
    await supabase.from('messages').insert({
      conversation_id: conversation.id,
      role: 'assistant',
      content: fallbackMessage,
      status: 'completed',
      tokens_used: 0
    })
  }

  return {
    success: true,
    data: conversation
  }
})
