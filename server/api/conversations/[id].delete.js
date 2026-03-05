import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Soft delete a conversation
 * DELETE /api/conversations/:id
 *
 * Marks conversation as deleted (soft delete) to allow undo
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

  // Verify conversation ownership and soft delete
  // ⚠️ Double vérification de sécurité: RLS + ownership check explicite
  const { data: conversation, error: deleteError } = await supabase
    .from('conversations')
    .update({
      deleted_at: new Date().toISOString()
    })
    .eq('id', conversationId)
    .eq('user_id', user.id) // ← Protection ownership explicite
    .select()
    .single()

  if (deleteError || !conversation) {
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  return {
    success: true,
    message: 'Conversation deleted'
  }
})
