/**
 * Helper: createSupabaseServerClient
 * Wrapper pour serverSupabaseClient du module @nuxtjs/supabase
 * Gère automatiquement l'authentification via les cookies
 */

import { serverSupabaseClient as _serverSupabaseClient } from '#supabase/server'

export default function createSupabaseServerClient(event) {
  return _serverSupabaseClient(event)
}

/**
 * Helper: getUserFromEvent
 * Récupère l'utilisateur depuis le client Supabase côté client
 * qui envoie automatiquement les cookies avec @nuxtjs/supabase
 */
export async function getUserFromEvent(event) {
  const cookies = parseCookies(event)

  console.log('[getUserFromEvent] Available cookies:', Object.keys(cookies))

  // Le module @nuxtjs/supabase stocke l'access token dans un cookie
  // Format: sb-{project-ref}-auth-token ou sb-{project-ref}-auth-token-code-verifier
  const supabaseCookies = Object.keys(cookies).filter(
    (key) => key.startsWith('sb-') && key.includes('-auth-token')
  )

  console.log('[getUserFromEvent] Supabase cookies found:', supabaseCookies)

  if (supabaseCookies.length === 0) {
    console.log('[getUserFromEvent] No Supabase auth cookies found')
    return null
  }

  // Parser le cookie principal (pas le code-verifier)
  const mainCookie = supabaseCookies.find((key) => !key.includes('code-verifier'))
  if (!mainCookie) {
    console.log('[getUserFromEvent] No main auth cookie found')
    return null
  }

  try {
    const authCookie = cookies[mainCookie]
    console.log(
      '[getUserFromEvent] Auth cookie value (truncated):',
      authCookie?.substring(0, 50) + '...'
    )

    if (!authCookie) return null

    // Le cookie Supabase est au format: base64-{json_encodé_en_base64}
    let sessionData
    if (authCookie.startsWith('base64-')) {
      const base64Part = authCookie.substring(7) // Enlever "base64-"
      const jsonString = Buffer.from(base64Part, 'base64').toString('utf-8')
      sessionData = JSON.parse(jsonString)
    } else {
      // Fallback si le format est différent
      sessionData = JSON.parse(decodeURIComponent(authCookie))
    }

    console.log('[getUserFromEvent] Decoded cookie structure:', Object.keys(sessionData))

    const accessToken = sessionData.access_token || sessionData[0]

    if (!accessToken) {
      console.log('[getUserFromEvent] No access token in cookie')
      return null
    }

    // Vérifier le token avec Supabase
    const {
      data: { user },
      error
    } = await supabase.auth.getUser(accessToken)

    if (error) {
      console.error('[getUserFromEvent] Error getting user:', error.message)
      return null
    }

    if (!user) {
      console.log('[getUserFromEvent] No user found for token')
      return null
    }

    console.log('[getUserFromEvent] User found:', user.id)
    return user
  } catch (error) {
    console.error('[getUserFromEvent] Error parsing Supabase cookie:', error.message)
    return null
  }
}
