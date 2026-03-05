/**
 * Supabase Admin Client
 * Client avec clé admin pour opérations serveur (bypass RLS)
 *
 * Uses lazy initialization to ensure useRuntimeConfig() is called
 * within the Nitro request context, not at module load time.
 */

import { createClient } from '@supabase/supabase-js'

let _supabase = null

/**
 * Get the admin Supabase client (lazily initialized)
 * @returns {import('@supabase/supabase-js').SupabaseClient}
 */
export function getAdminSupabase() {
  if (!_supabase) {
    const config = useRuntimeConfig()

    if (!config.public?.supabaseUrl || !config.supabaseAdminKey) {
      console.error('[Supabase Admin] Missing config:', {
        hasUrl: !!config.public?.supabaseUrl,
        hasKey: !!config.supabaseAdminKey
      })
      throw new Error('Supabase admin client not configured properly')
    }

    _supabase = createClient(config.public.supabaseUrl, config.supabaseAdminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return _supabase
}

// For backwards compatibility - use a Proxy to lazily initialize
const adminSupabase = new Proxy(
  {},
  {
    get(_, prop) {
      return getAdminSupabase()[prop]
    }
  }
)

export default adminSupabase
