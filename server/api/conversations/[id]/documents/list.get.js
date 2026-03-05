import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: List documents for a conversation
 * GET /api/conversations/:id/documents/list
 *
 * Returns all documents attached to a conversation
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const conversationId = event.context.params.id

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

  // 3. Récupérer les documents (sans le texte extrait complet)
  const { data: documents, error: docsError } = await supabase
    .from('documents')
    .select(
      `
      id,
      filename,
      file_url,
      file_type,
      file_size,
      word_count,
      estimated_tokens,
      created_at,
      uploaded_by
    `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (docsError) {
    console.error('Error fetching documents:', docsError)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch documents'
    })
  }

  // 4. Générer des URLs signées pour chaque document
  const documentsWithSignedUrls = await Promise.all(
    (documents || []).map(async (doc) => {
      // Extraire le storage path depuis l'URL
      const urlParts = doc.file_url.split('/storage/v1/object/public/chat-documents/')
      const storagePath = urlParts[1] ? decodeURIComponent(urlParts[1]) : null

      if (storagePath) {
        // Générer une URL signée valide pour 1 heure
        const { data: signedData, error: signError } = await supabase.storage
          .from('chat-documents')
          .createSignedUrl(storagePath, 3600)

        if (!signError && signedData?.signedUrl) {
          return {
            ...doc,
            file_url: signedData.signedUrl
          }
        }
      }

      return doc
    })
  )

  return {
    success: true,
    documents: documentsWithSignedUrls || [],
    total_documents: documentsWithSignedUrls?.length || 0,
    total_tokens:
      documentsWithSignedUrls?.reduce((sum, doc) => sum + (doc.estimated_tokens || 0), 0) || 0
  }
})
