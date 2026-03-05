import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Créer un nouveau GPT
 * POST /api/gpts/create
 *
 * Permissions: Admin seulement
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

  // Vérifier le rôle admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
    throw createError({
      statusCode: 403,
      message: 'Forbidden: Admin access required'
    })
  }

  // Lire les données du body
  const body = await readBody(event)
  const {
    name,
    description,
    icon,
    instructions,
    welcome_message,
    conversation_starters = [],
    knowledge_files = [],
    recommended_model,
    provider,
    reasoning_effort = 'medium'
  } = body

  // Validation
  if (!name || !instructions || !recommended_model || !provider) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: name, instructions, recommended_model, provider'
    })
  }

  // Normalize x-ai to xai for backward compatibility
  const normalizedProvider = provider === 'x-ai' ? 'xai' : provider

  if (!['openai', 'anthropic', 'gemini', 'google', 'mistral', 'xai'].includes(normalizedProvider)) {
    throw createError({
      statusCode: 400,
      message: 'Invalid provider. Must be: openai, anthropic, google, gemini, mistral, or xai'
    })
  }

  // Valider reasoning_effort
  const validReasoningEffort = ['low', 'medium', 'high'].includes(reasoning_effort)
    ? reasoning_effort
    : 'medium'

  // Créer le GPT
  const { data: gpt, error } = await supabase
    .from('gpts')
    .insert({
      name,
      description,
      icon,
      instructions,
      welcome_message,
      conversation_starters,
      knowledge_files,
      recommended_model,
      provider: normalizedProvider,
      reasoning_effort: validReasoningEffort,
      created_by: user.id
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating GPT:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to create GPT'
    })
  }

  return {
    success: true,
    data: gpt
  }
})
