import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Récupérer les messages d'une conversation
 * GET /api/conversations/:id/messages
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const conversationId = event.context.params.id

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

  // Vérifier que la conversation appartient à l'utilisateur (RLS vérifie aussi)
  const { data: conversation, error: convError } = await supabase
    .from('conversations')
    .select('id, user_id')
    .eq('id', conversationId)
    .single()

  if (convError || !conversation) {
    throw createError({
      statusCode: 404,
      message: 'Conversation not found'
    })
  }

  // Récupérer les messages avec leurs documents
  const { data: messages, error } = await supabase
    .from('messages')
    .select(
      `
      *,
      message_documents (
        document_id,
        documents (
          id,
          filename,
          file_url,
          file_type,
          file_size
        )
      )
    `
    )
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching messages:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch messages'
    })
  }

  // Transform the data to flatten the documents array and generate signed URLs
  const transformedMessages = await Promise.all(
    (messages || []).map(async (msg) => {
      const documents = msg.message_documents?.map((md) => md.documents).filter(Boolean) || []

      // Générer des URLs signées pour chaque document
      const documentsWithSignedUrls = await Promise.all(
        documents.map(async (doc) => {
          if (!doc.file_url) return doc

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
        ...msg,
        documents: documentsWithSignedUrls
      }
    })
  )

  // Remove the message_documents field as it's no longer needed
  transformedMessages.forEach((msg) => delete msg.message_documents)

  return {
    success: true,
    data: transformedMessages
  }
})
