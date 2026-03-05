import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Lister les GPTs accessibles par l'utilisateur
 * GET /api/gpts/list
 *
 * Retourne les GPTs selon les permissions (RLS appliqué automatiquement)
 */

export default defineEventHandler(async (event) => {
  // serverSupabaseClient est auto-importé par @nuxtjs/supabase
  // Il gère automatiquement l'authentification via les cookies
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

  // Récupérer les GPTs (RLS filtre automatiquement selon les permissions)
  const { data: gpts, error } = await supabase
    .from('gpts')
    .select(
      `
      *,
      created_by_profile:profiles!created_by(id, email, first_name, last_name)
    `
    )
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching GPTs:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch GPTs'
    })
  }

  return {
    success: true,
    data: gpts || []
  }
})
