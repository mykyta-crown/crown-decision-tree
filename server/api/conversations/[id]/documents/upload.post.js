import { serverSupabaseClient } from '#supabase/server'
import { extractText, validateFile } from '~/server/utils/documentExtractor.js'

/**
 * API Route: Upload document to conversation
 * POST /api/conversations/:id/documents/upload
 *
 * Body: FormData with 'file' field
 *
 * Process:
 * 1. Validate file (size, type)
 * 2. Upload to Supabase Storage
 * 3. Extract text content
 * 4. Save metadata to database
 * 5. Return document info
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

  // 3. Parser le FormData
  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    throw createError({
      statusCode: 400,
      message: 'File is required'
    })
  }

  // 4. Valider le fichier
  try {
    validateFile(file.size, file.type)
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error.message
    })
  }

  // 5. Convertir le fichier en Buffer pour l'extraction
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 6. Extraire le texte du document
  let extractedData
  try {
    extractedData = await extractText(buffer, file.type)
  } catch (error) {
    console.error('Error extracting text:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to extract text from document: ' + error.message
    })
  }

  // 7. Upload vers Supabase Storage
  // Structure: chat-documents/{user_id}/{conversation_id}/{filename}
  const timestamp = Date.now()
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${user.id}/${conversationId}/${timestamp}_${sanitizedFilename}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('chat-documents')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    console.error('Error uploading to storage:', uploadError)
    throw createError({
      statusCode: 500,
      message: 'Failed to upload document: ' + uploadError.message
    })
  }

  // 8. Obtenir l'URL publique (signée pour accès privé)
  const { data: urlData } = supabase.storage.from('chat-documents').getPublicUrl(storagePath)

  // 9. Sauvegarder les métadonnées dans la DB
  const { data: document, error: dbError } = await supabase
    .from('documents')
    .insert({
      conversation_id: conversationId,
      uploaded_by: user.id,
      filename: file.name,
      file_url: urlData.publicUrl,
      file_type: file.type,
      file_size: file.size,
      extracted_text: extractedData.text,
      word_count: extractedData.wordCount,
      estimated_tokens: extractedData.estimatedTokens
    })
    .select()
    .single()

  if (dbError) {
    console.error('Error saving document metadata:', dbError)

    // Nettoyer le fichier uploadé si la DB échoue
    await supabase.storage.from('chat-documents').remove([storagePath])

    throw createError({
      statusCode: 500,
      message: 'Failed to save document metadata: ' + dbError.message
    })
  }

  // 10. Générer une URL signée pour le document
  const { data: signedData, error: signError } = await supabase.storage
    .from('chat-documents')
    .createSignedUrl(storagePath, 3600) // Valide 1 heure

  const fileUrl = !signError && signedData?.signedUrl ? signedData.signedUrl : document.file_url

  // 11. Retourner les informations du document (sans le texte complet pour économiser la bande passante)
  return {
    success: true,
    document: {
      id: document.id,
      filename: document.filename,
      file_url: fileUrl,
      file_type: document.file_type,
      file_size: document.file_size,
      word_count: document.word_count,
      estimated_tokens: document.estimated_tokens,
      uploaded_at: document.created_at
    }
  }
})
