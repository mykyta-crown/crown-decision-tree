import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Supprimer un GPT
 * DELETE /api/gpts/:id
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

  // Supprimer le GPT (cascade supprimera aussi gpt_access et conversations)
  const { error } = await supabase.from('gpts').delete().eq('id', gptId)

  if (error) {
    console.error('Error deleting GPT:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete GPT'
    })
  }

  return {
    success: true,
    message: 'GPT deleted successfully'
  }
})
