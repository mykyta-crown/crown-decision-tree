import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Récupérer les détails d'un GPT
 * GET /api/gpts/:id
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

  // Récupérer le GPT (RLS filtre automatiquement)
  const { data: gpt, error } = await supabase
    .from('gpts')
    .select(
      `
      *,
      created_by_profile:profiles!created_by(id, email, first_name, last_name),
      gpt_access(
        id,
        user:profiles(id, email, first_name, last_name),
        company:companies(id, name)
      )
    `
    )
    .eq('id', gptId)
    .single()

  if (error || !gpt) {
    throw createError({
      statusCode: 404,
      message: 'GPT not found'
    })
  }

  return {
    success: true,
    data: gpt
  }
})
