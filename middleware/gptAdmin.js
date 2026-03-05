/**
 * Middleware: gptAdmin
 * Vérifie que l'utilisateur a le rôle admin pour accéder aux routes GPT admin
 * Utilisé pour /gpts/create et autres routes admin
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()

  // Récupérer l'utilisateur authentifié
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  // Vérifier que l'utilisateur est authentifié
  if (authError || !user) {
    return navigateTo('/auth/signin')
  }

  // Récupérer le profil de l'utilisateur
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Error fetching user profile:', error)
    return navigateTo('/')
  }

  // Vérifier le rôle admin
  if (profile.role !== 'admin') {
    console.warn('Access denied: Admin role required')
    return navigateTo('/gpts/chat')
  }

  // Si tout est OK, continuer
  return
})
