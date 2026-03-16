/**
 * Middleware: auth (global)
 * Vérifie que l'utilisateur est authentifié pour accéder à la route
 * Redirige vers /auth/signin si non authentifié
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  // Pages publiques qui ne nécessitent pas d'authentification
  const publicPages = [
    '/',
    '/auth/signin',
    '/auth/signup',
    '/auth/reset',
    '/auth/ask-password-change'
  ]

  // Si la page est publique, ne pas vérifier l'authentification
  if (publicPages.includes(to.path)) {
    return
  }

  // Routes decisionTree sont publiques
  if (to.path.startsWith('/decisionTree')) {
    return
  }

  // Routes architect : réservées aux admins et buyers (pas les suppliers)
  if (to.path.startsWith('/architect')) {
    const supabase = useSupabaseClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return navigateTo('/auth/signin')

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    const allowedRoles = ['admin', 'buyer', 'super_buyer']
    if (!profile || !allowedRoles.includes(profile.role)) {
      return navigateTo('/home')
    }
    return
  }

  const supabase = useSupabaseClient()
  const user = useSupabaseUser()

  // Si l'utilisateur n'est pas encore chargé, vérifier la session de manière asynchrone
  if (!user.value) {
    try {
      const {
        data: { session },
        error
      } = await supabase.auth.getSession()

      // Si pas de session valide, rediriger vers login
      if (error || !session) {
        return navigateTo('/auth/signin')
      }

      // La session existe, laisser le module la charger
      // (le composable useSupabaseUser sera mis à jour automatiquement)
    } catch (error) {
      console.error('Auth middleware error:', error)
      return navigateTo('/auth/signin')
    }
  }

  // Si authentifié, continuer
  return
})
