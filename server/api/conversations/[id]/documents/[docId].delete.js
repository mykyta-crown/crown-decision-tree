import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Delete a document
 * DELETE /api/conversations/:id/documents/:docId
 *
 * Deletes both the file from storage and the database record
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const conversationId = event.context.params.id
  const docId = event.context.params.docId

  // 1. Vérifier l'authentification
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

  // 2. Vérifier que la conversation existe et appartient à l'utilisateur
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, user_id')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation || conversation.user_id !== user.id) {
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  // 3. Récupérer le document pour obtenir l'URL de stockage
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select('id, file_url, uploaded_by, conversation_id')
    .eq('id', docId)
    .eq('conversation_id', conversationId)
    .single()

  if (docError || !document) {
    throw createError({
      statusCode: 404,
      message: 'Document not found'
    })
  }

  // 4. Vérifier que l'utilisateur est le propriétaire du document
  if (document.uploaded_by !== user.id) {
    throw createError({
      statusCode: 403,
      message: 'You can only delete your own documents'
    })
  }

  // 5. Extraire le chemin de stockage depuis l'URL
  // URL format: https://xxx.supabase.co/storage/v1/object/public/chat-documents/{path}
  const urlParts = document.file_url.split('/chat-documents/')
  const storagePath = urlParts[1]

  if (!storagePath) {
    console.error('Invalid file URL:', document.file_url)
    throw createError({
      statusCode: 500,
      message: 'Invalid file URL'
    })
  }

  // 6. Supprimer le fichier du storage
  const { error: storageError } = await supabase.storage
    .from('chat-documents')
    .remove([storagePath])

  if (storageError) {
    console.error('Error deleting file from storage:', storageError)
    // Continue quand même pour supprimer l'entrée DB
  }

  // 7. Supprimer l'entrée de la DB (RLS policy vérifie uploaded_by)
  const { error: deleteError } = await supabase
    .from('documents')
    .delete()
    .eq('id', docId)
    .eq('uploaded_by', user.id)

  if (deleteError) {
    console.error('Error deleting document from database:', deleteError)
    throw createError({
      statusCode: 500,
      message: 'Failed to delete document'
    })
  }

  return {
    success: true,
    message: 'Document deleted successfully'
  }
})
