import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Generate conversation title with AI
 * POST /api/conversations/:id/rename
 *
 * Automatically generates a short, descriptive title based on the first 2-3 exchanges
 * (includes context from multiple messages for better title generation)
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const conversationId = event.context.params.id
  const config = useRuntimeConfig()

  // Verify authentication
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

  // Verify conversation ownership
  // ⚠️ Double vérification de sécurité: RLS + ownership check explicite
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, user_id')
    .eq('id', conversationId)
    .eq('user_id', user.id) // ← Protection ownership explicite
    .single()

  if (convError || !conversation) {
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  // Fetch messages for context (get first 6-8 messages for 2-3 exchanges)
  const { data: messages, error: msgError } = await supabase
    .from('messages')
    .select('role, content')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })
    .limit(8) // Get up to 8 messages (welcome + 3 exchanges max)

  if (msgError || !messages || messages.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No messages found'
    })
  }

  // Skip the welcome message (first assistant message)
  const conversationMessages = messages.filter((m) => {
    const isFirstMessage = messages.indexOf(m) === 0
    const isWelcome = isFirstMessage && m.role === 'assistant'
    return !isWelcome
  })

  if (conversationMessages.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'No conversation messages found'
    })
  }

  // Build context from messages (limit to first 6 messages after welcome)
  const contextMessages = conversationMessages.slice(0, 6)
  const conversationContext = contextMessages
    .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
    .join('\n\n')

  // Generate title with OpenRouter
  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.openrouterApiKey}`,
        'HTTP-Referer': config.openrouterAppUrl || 'https://crown.ovh',
        'X-Title': config.openrouterAppName || 'Crown GPT',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'openai/gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Génère un titre très court (3-5 mots maximum) en français qui résume le sujet principal ou le thème de cette conversation. Analyse le contexte de plusieurs messages pour comprendre le sujet central. Retourne UNIQUEMENT le titre, sans guillemets, sans ponctuation à la fin.'
          },
          {
            role: 'user',
            content: `Conversation:\n\n${conversationContext}\n\nGénère un titre court pour cette conversation en français.`
          }
        ],
        max_tokens: 25,
        temperature: 0.7
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('OpenRouter API error:', errorText)
      throw new Error(`OpenRouter API error (${response.status})`)
    }

    const data = await response.json()
    let title = data.choices?.[0]?.message?.content?.trim() || 'New conversation'

    // Clean up the title (remove quotes if present)
    title = title.replace(/^["']|["']$/g, '')

    // Limit length
    if (title.length > 50) {
      title = title.substring(0, 47) + '...'
    }

    // Update conversation title
    // ⚠️ Défense en profondeur: vérification ownership sur l'UPDATE aussi
    const { error: updateError } = await supabase
      .from('conversations')
      .update({
        title,
        updated_at: new Date().toISOString()
      })
      .eq('id', conversationId)
      .eq('user_id', user.id) // ← Double protection contre modification non autorisée

    if (updateError) {
      throw updateError
    }

    return {
      success: true,
      title
    }
  } catch (error) {
    console.error('Error generating title:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to generate title'
    })
  }
})
