import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Ajouter des crédits à un utilisateur
 * POST /api/credits/add
 *
 * Permissions: Admin seulement
 * Body: { user_id: string, amount: number }
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
  const { user_id, amount } = body

  if (!user_id || !amount) {
    throw createError({
      statusCode: 400,
      message: 'Missing required fields: user_id, amount'
    })
  }

  if (amount <= 0) {
    throw createError({
      statusCode: 400,
      message: 'Amount must be positive'
    })
  }

  // Ajouter les crédits via RPC
  const { error } = await supabase.rpc('add_user_credits', {
    p_user_id: user_id,
    p_amount: amount
  })

  if (error) {
    console.error('Error adding credits:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to add credits'
    })
  }

  // Récupérer le nouveau solde
  const { data: credits } = await supabase.rpc('get_user_credits', {
    p_user_id: user_id
  })

  return {
    success: true,
    data: credits?.[0] || { credits_remaining: 0, credits_total: 0 },
    message: `${amount} credits added successfully`
  }
})
