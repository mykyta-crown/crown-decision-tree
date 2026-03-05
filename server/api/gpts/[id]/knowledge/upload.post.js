import { serverSupabaseClient } from '#supabase/server'
import { extractText, validateFile } from '~/server/utils/documentExtractor.js'

/**
 * API Route: Upload knowledge file to GPT
 * POST /api/gpts/:id/knowledge/upload
 *
 * Body: FormData with 'file' field
 *
 * Process:
 * 1. Validate authentication and access
 * 2. Validate file (size, type)
 * 3. Extract text content
 * 4. Upload to Supabase Storage (gpt-knowledge bucket)
 * 5. Save metadata to database
 * 6. Return file info
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)
  const gptId = event.context.params.id

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

  // 2. Verify GPT exists and user has access
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

  // 3. Check user access (via gpt_access, creator, or admin role)
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('company_id, role')
    .eq('id', user.id)
    .single()

  const isAdmin = userProfile?.role === 'admin'

  const { data: access } = await supabase
    .from('gpt_access')
    .select('id')
    .eq('gpt_id', gptId)
    .or(`user_id.eq.${user.id},company_id.eq.${userProfile?.company_id}`)
    .maybeSingle()

  const hasAccess = isAdmin || gpt.created_by === user.id || access !== null

  if (!hasAccess) {
    throw createError({
      statusCode: 403,
      message: 'Access denied to this GPT'
    })
  }

  // 4. Parse FormData
  const formData = await readFormData(event)
  const file = formData.get('file')

  if (!file || !(file instanceof File)) {
    throw createError({
      statusCode: 400,
      message: 'File is required'
    })
  }

  // 5. Validate file
  try {
    validateFile(file.size, file.type)
  } catch (error) {
    throw createError({
      statusCode: 400,
      message: error.message
    })
  }

  // 6. Convert file to Buffer for extraction
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)

  // 7. Extract text from document
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

  // 8. Upload to Supabase Storage
  // Structure: {gpt_id}/{timestamp}_{filename}
  const timestamp = Date.now()
  const sanitizedFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${gptId}/${timestamp}_${sanitizedFilename}`

  const { data: uploadData, error: uploadError } = await supabase.storage
    .from('gpt-knowledge')
    .upload(storagePath, buffer, {
      contentType: file.type,
      upsert: false
    })

  if (uploadError) {
    console.error('Error uploading to storage:', uploadError)
    throw createError({
      statusCode: 500,
      message: 'Failed to upload file: ' + uploadError.message
    })
  }

  // 9. Get public URL
  const { data: urlData } = supabase.storage.from('gpt-knowledge').getPublicUrl(storagePath)

  // 10. Save metadata to database
  const { data: knowledgeFile, error: dbError } = await supabase
    .from('gpt_knowledge_files')
    .insert({
      gpt_id: gptId,
      uploaded_by: user.id,
      filename: file.name,
      file_url: storagePath,
      file_type: file.type,
      file_size: file.size,
      extracted_text: extractedData.text,
      word_count: extractedData.wordCount,
      estimated_tokens: extractedData.estimatedTokens
    })
    .select()
    .single()

  if (dbError) {
    console.error('Error saving file metadata:', dbError)

    // Clean up uploaded file if database save fails
    await supabase.storage.from('gpt-knowledge').remove([storagePath])

    throw createError({
      statusCode: 500,
      message: 'Failed to save file metadata: ' + dbError.message
    })
  }

  // 11. Return file information (without full text to save bandwidth)
  return {
    success: true,
    file: {
      id: knowledgeFile.id,
      filename: knowledgeFile.filename,
      file_type: knowledgeFile.file_type,
      file_size: knowledgeFile.file_size,
      word_count: knowledgeFile.word_count,
      estimated_tokens: knowledgeFile.estimated_tokens,
      uploaded_at: knowledgeFile.created_at
    }
  }
})
