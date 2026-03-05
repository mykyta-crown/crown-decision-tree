import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Delete a knowledge file from a GPT
 * DELETE /api/gpts/:id/knowledge/:fileId
 *
 * Removes file from storage and database
 * Only accessible by GPT creators and admins
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const gptId = event.context.params.id
  const fileId = event.context.params.fileId

  // 1. Verify authentication
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

  // 2. Get user profile to check role
  const { data: userProfile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (profileError) {
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch user profile'
    })
  }

  // 3. Verify GPT exists
  const { data: gpt, error: gptError } = await supabase
    .from('gpts')
    .select('id, name, created_by')
    .eq('id', gptId)
    .single()

  if (gptError || !gpt) {
    throw createError({
      statusCode: 404,
      message: 'GPT not found'
    })
  }

  // 4. Check if user is creator or admin
  const isCreator = gpt.created_by === user.id
  const isAdmin = userProfile.role === 'admin'

  if (!isCreator && !isAdmin) {
    throw createError({
      statusCode: 403,
      message: 'Only the GPT creator or admins can delete knowledge files'
    })
  }

  // 5. Get file info before deletion
  const { data: file, error: fileError } = await supabase
    .from('gpt_knowledge_files')
    .select('id, file_url, filename')
    .eq('id', fileId)
    .eq('gpt_id', gptId)
    .single()

  if (fileError || !file) {
    throw createError({
      statusCode: 404,
      message: 'Knowledge file not found'
    })
  }

  // 6. Delete file from storage
  const { error: storageError } = await supabase.storage
    .from('gpt-knowledge')
    .remove([file.file_url])

  if (storageError) {
    console.error('Error deleting file from storage:', storageError)
    // Continue with database deletion even if storage fails
    // (file might have been already deleted)
  }

  // 7. Delete file record from database
  // This will also trigger the sync function to update gpts.knowledge_files
  const { error: deleteError } = await supabase
    .from('gpt_knowledge_files')
    .delete()
    .eq('id', fileId)
    .eq('gpt_id', gptId)

  if (deleteError) {
    console.error('Error deleting file record:', deleteError)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete file record: ' + deleteError.message
    })
  }

  return {
    success: true,
    message: 'Knowledge file deleted successfully',
    deleted_file: {
      id: file.id,
      filename: file.filename
    }
  }
})
