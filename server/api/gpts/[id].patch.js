import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Modifier un GPT
 * PATCH /api/gpts/:id
 *
 * Permissions: Admin seulement
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const gptId = event.context.params.id

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
    conversation_starters,
    knowledge_files,
    recommended_model,
    provider,
    reasoning_effort
  } = body

  // Préparer les données à mettre à jour (seulement les champs fournis)
  const updateData = {}
  if (name !== undefined) updateData.name = name
  if (description !== undefined) updateData.description = description
  if (icon !== undefined) updateData.icon = icon
  if (instructions !== undefined) updateData.instructions = instructions
  if (welcome_message !== undefined) updateData.welcome_message = welcome_message
  if (conversation_starters !== undefined) updateData.conversation_starters = conversation_starters
  if (knowledge_files !== undefined) updateData.knowledge_files = knowledge_files
  if (recommended_model !== undefined) updateData.recommended_model = recommended_model
  if (provider !== undefined) {
    // Normalize x-ai to xai for backward compatibility
    const normalizedProvider = provider === 'x-ai' ? 'xai' : provider

    if (
      !['openai', 'anthropic', 'gemini', 'google', 'mistral', 'xai'].includes(normalizedProvider)
    ) {
      throw createError({
        statusCode: 400,
        message: 'Invalid provider. Must be: openai, anthropic, google, gemini, mistral, or xai'
      })
    }
    updateData.provider = normalizedProvider
  }
  if (reasoning_effort !== undefined) {
    if (!['low', 'medium', 'high'].includes(reasoning_effort)) {
      throw createError({
        statusCode: 400,
        message: 'Invalid reasoning_effort. Must be: low, medium, or high'
      })
    }
    updateData.reasoning_effort = reasoning_effort
  }

  // Mettre à jour le GPT
  const { data: gpt, error } = await supabase
    .from('gpts')
    .update(updateData)
    .eq('id', gptId)
    .select()
    .single()

  if (error) {
    console.error('Error updating GPT:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to update GPT'
    })
  }

  return {
    success: true,
    data: gpt
  }
})
