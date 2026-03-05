import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Lister les conversations de l'utilisateur
 * GET /api/conversations/list?gpt_id=xxx (optionnel)
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const query = getQuery(event)
  const gptId = query.gpt_id

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

  // Construire la requête
  let queryBuilder = supabase
    .from('conversations')
    .select(
      `
      *,
      gpts(id, name, description, provider),
      messages(id, role, content, created_at)
    `
    )
    .eq('user_id', user.id)
    .is('deleted_at', null) // ← Exclure les conversations supprimées (soft delete)
    .order('updated_at', { ascending: false })

  // Filtrer par GPT si spécifié
  if (gptId) {
    queryBuilder = queryBuilder.eq('gpt_id', gptId)
  }

  const { data: conversations, error } = await queryBuilder

  if (error) {
    console.error('Error fetching conversations:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch conversations'
    })
  }

  return {
    success: true,
    data: conversations || []
  }
})
