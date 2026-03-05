import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Restore a soft-deleted conversation
 * POST /api/conversations/:id/restore
 *
 * Undoes soft delete by setting deleted_at to NULL
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const conversationId = event.context.params.id

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

  // Restore conversation (remove deleted_at)
  // ⚠️ Double vérification de sécurité: RLS + ownership check explicite
  const { data: conversation, error: restoreError } = await supabase
    .from('conversations')
    .update({
      deleted_at: null
    })
    .eq('id', conversationId)
    .eq('user_id', user.id) // ← Protection ownership explicite
    .select()
    .single()

  if (restoreError || !conversation) {
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  return {
    success: true,
    conversation
  }
})
