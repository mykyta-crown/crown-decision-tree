import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Get all knowledge files for a GPT
 * GET /api/gpts/:id/knowledge
 *
 * Returns: Array of knowledge files with metadata
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

  // 2. Verify GPT exists
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

  // 4. Get all knowledge files for this GPT (RLS will filter automatically)
  const { data: files, error: filesError } = await supabase
    .from('gpt_knowledge_files')
    .select(
      `
      id,
      filename,
      file_type,
      file_size,
      word_count,
      estimated_tokens,
      uploaded_by,
      created_at,
      profiles:uploaded_by (
        id,
        email,
        first_name,
        last_name
      )
    `
    )
    .eq('gpt_id', gptId)
    .order('created_at', { ascending: false })

  if (filesError) {
    console.error('Error fetching knowledge files:', filesError)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch knowledge files: ' + filesError.message
    })
  }

  // 5. Format response with uploader info
  const formattedFiles = files.map((file) => ({
    id: file.id,
    filename: file.filename,
    file_type: file.file_type,
    file_size: file.file_size,
    word_count: file.word_count,
    estimated_tokens: file.estimated_tokens,
    uploaded_at: file.created_at,
    uploaded_by: {
      id: file.profiles?.id,
      email: file.profiles?.email,
      name:
        file.profiles?.first_name && file.profiles?.last_name
          ? `${file.profiles.first_name} ${file.profiles.last_name}`
          : file.profiles?.email
    }
  }))

  return {
    success: true,
    files: formattedFiles
  }
})
