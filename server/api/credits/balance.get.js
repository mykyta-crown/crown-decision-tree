import { serverSupabaseClient } from '#supabase/server'

/**
 * API Route: Récupérer le solde de crédits de l'utilisateur
 * GET /api/credits/balance
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

  // Récupérer les crédits (avec création automatique si n'existe pas)
  const { data: credits, error } = await supabase.rpc('get_user_credits', {
    p_user_id: user.id
  })

  if (error) {
    console.error('Error fetching credits:', error)
    throw createError({
      statusCode: 500,
      message: 'Failed to fetch credits'
    })
  }

  const userCredits = credits?.[0] || {
    credits_remaining: 0,
    credits_total: 0
  }

  return {
    success: true,
    data: {
      credits_remaining: userCredits.credits_remaining,
      credits_total: userCredits.credits_total
    }
  }
})
