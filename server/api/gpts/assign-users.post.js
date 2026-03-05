import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Assigner des utilisateurs/entreprises à un GPT
 * POST /api/gpts/assign-users
 *
 * Permissions: Admin seulement
 *
 * Body: {
 *   gpt_id: string,
 *   user_ids?: string[],
 *   company_ids?: string[]
 * }
 */

export default defineEventHandler(async (event) => {
  const supabase = await serverSupabaseClient(event)

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

  // Lire les données du body
  const body = await readBody(event)
  const { gpt_id, user_ids = [], company_ids = [] } = body

  console.log('[assign-users] Request:', { gpt_id, user_ids, company_ids })

  if (!gpt_id) {
    throw createError({
      statusCode: 400,
      message: 'Missing required field: gpt_id'
    })
  }

  // Dédupliquer les IDs pour éviter les doublons
  const uniqueUserIds = [...new Set(user_ids.filter((id) => id))]
  const uniqueCompanyIds = [...new Set(company_ids.filter((id) => id))]

  // Note: empty arrays are allowed - this allows removing all access except creator

  // Vérifier que le GPT existe et récupérer le créateur
  const { data: gpt, error: gptError } = await supabase
    .from('gpts')
    .select('id, created_by')
    .eq('id', gpt_id)
    .single()

  if (gptError || !gpt) {
    throw createError({
      statusCode: 404,
      message: 'GPT not found'
    })
  }

  // Step 1: Get existing assignments
  const { data: existingAccesses } = await supabase
    .from('gpt_access')
    .select('id, user_id, company_id')
    .eq('gpt_id', gpt_id)

  // Step 2: Determine which accesses to delete
  const accessesToDelete = []
  if (existingAccesses) {
    for (const access of existingAccesses) {
      const isUserAccess = access.user_id !== null
      const isCompanyAccess = access.company_id !== null

      if (isUserAccess && !user_ids.includes(access.user_id)) {
        accessesToDelete.push(access.id)
      } else if (isCompanyAccess && !company_ids.includes(access.company_id)) {
        accessesToDelete.push(access.id)
      }
    }
  }

  // Step 3: Delete removed accesses
  if (accessesToDelete.length > 0) {
    const { error: deleteError } = await supabase
      .from('gpt_access')
      .delete()
      .in('id', accessesToDelete)

    if (deleteError) {
      console.error('Error deleting accesses:', deleteError)
      throw createError({
        statusCode: 500,
        message: 'Failed to remove old access assignments'
      })
    }
  }

  // Step 4: Prepare new accesses to insert (only ones that don't exist yet)
  const existingUserIds = new Set(
    (existingAccesses || []).filter((a) => a.user_id !== null).map((a) => a.user_id)
  )
  const existingCompanyIds = new Set(
    (existingAccesses || []).filter((a) => a.company_id !== null).map((a) => a.company_id)
  )

  const userAccesses = []
  const companyAccesses = []

  // Add user accesses (only if they don't exist already)
  for (const userId of user_ids) {
    if (!existingUserIds.has(userId)) {
      userAccesses.push({
        gpt_id,
        user_id: userId,
        company_id: null
      })
    }
  }

  // Add company accesses (only if they don't exist already)
  for (const companyId of company_ids) {
    if (!existingCompanyIds.has(companyId)) {
      companyAccesses.push({
        gpt_id,
        user_id: null,
        company_id: companyId
      })
    }
  }

  // Step 5: Insert new accesses (we already deleted old ones, so just insert)
  console.log('[assign-users] Inserting user accesses:', userAccesses)
  console.log('[assign-users] Inserting company accesses:', companyAccesses)

  const insertedAccesses = []

  // Insert user accesses
  if (userAccesses.length > 0) {
    const { data: insertedUsers, error: userError } = await supabase
      .from('gpt_access')
      .insert(userAccesses)
      .select()

    if (userError) {
      console.error('[assign-users] Error inserting users:', userError)
      throw createError({
        statusCode: 500,
        message: 'Failed to assign users to GPT'
      })
    }

    if (insertedUsers) {
      insertedAccesses.push(...insertedUsers)
    }
  }

  // Insert company accesses
  if (companyAccesses.length > 0) {
    const { data: insertedCompanies, error: companyError } = await supabase
      .from('gpt_access')
      .insert(companyAccesses)
      .select()

    if (companyError) {
      console.error('[assign-users] Error inserting companies:', companyError)
      throw createError({
        statusCode: 500,
        message: 'Failed to assign companies to GPT'
      })
    }

    if (insertedCompanies) {
      insertedAccesses.push(...insertedCompanies)
    }
  }

  console.log('[assign-users] Success:', {
    inserted: insertedAccesses.length,
    deleted: accessesToDelete.length
  })

  return {
    success: true,
    data: insertedAccesses,
    deleted: accessesToDelete.length,
    message: `Updated GPT access: ${insertedAccesses.length} assigned, ${accessesToDelete.length} removed`
  }
})
