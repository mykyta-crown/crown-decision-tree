/**
 * Middleware: gptAccess (use as 'gpt-access' in definePageMeta)
 * Checks that the user has admin or buyer role to access GPT routes
 * Used for /gpts/chat and other GPT routes accessible by admins and buyers
 */

export default defineNuxtRouteMiddleware(async (to, from) => {
  const supabase = useSupabaseClient()

  // Get authenticated user
  const {
    data: { user },
    error: authError
  } = await supabase.auth.getUser()

  // Check that user is authenticated
  if (authError || !user) {
    return navigateTo('/auth/signin')
  }

  // Get user profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    console.error('Error fetching user profile:', error)
    return navigateTo('/')
  }

  // Check admin or buyer role
  const allowedRoles = ['admin', 'buyer', 'super_buyer']
  if (!allowedRoles.includes(profile.role)) {
    console.warn('Access denied: Admin or Buyer role required for GPT access')
    return navigateTo('/dashboard')
  }

  // If everything is OK, continue
  return
})
