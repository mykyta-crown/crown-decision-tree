/**
 * PDF Export Authentication & Authorization Utilities
 * Handles JWT token validation and RLS policy enforcement
 */

/**
 * Authenticate user from Authorization header
 * @param {H3Event} event - Nuxt event object
 * @returns {Promise<{user: Object, token: string}>}
 * @throws {Error} If authentication fails
 */
export async function authenticateUser(event) {
  const authHeader = getRequestHeader(event, 'authorization')

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Authentication required. Please log in.'
    })
  }

  const token = authHeader.replace('Bearer ', '')

  // Get Supabase configuration
  const config = useRuntimeConfig()
  const { createClient } = await import('@supabase/supabase-js')

  // Create admin client for token verification
  const adminSupabase = createClient(config.public.supabase.url, config.public.supabase.key)

  // Verify token is valid
  const {
    data: { user },
    error: authError
  } = await adminSupabase.auth.getUser(token)

  if (authError || !user) {
    console.warn('[PDF Auth] Invalid token attempt')
    throw createError({
      statusCode: 401,
      statusMessage: 'Invalid or expired token. Please log in again.'
    })
  }

  console.log(`[PDF Auth] User ${user.id} (${user.email}) authenticated`)

  return { user, token }
}

/**
 * Create Supabase client with user token (RLS policies will apply)
 * @param {string} token - JWT token
 * @returns {SupabaseClient}
 */
export async function createUserSupabaseClient(token) {
  const config = useRuntimeConfig()
  const { createClient } = await import('@supabase/supabase-js')

  return createClient(config.public.supabase.url, config.public.supabase.key, {
    global: {
      headers: {
        Authorization: `Bearer ${token}`
      }
    }
  })
}

/**
 * Authorize user access to auction
 * Fetches auction with RLS policies applied - if successful, user is authorized
 * @param {SupabaseClient} userSupabase - User's Supabase client
 * @param {string} auctionId - Auction ID
 * @param {Object} user - Authenticated user object
 * @returns {Promise<Object>} - Auction data
 * @throws {Error} If user is not authorized
 */
export async function authorizeAuctionAccess(userSupabase, auctionId, user) {
  // Fetch auction with RLS policies applied
  const { data: auction, error: auctionError } = await userSupabase
    .from('auctions')
    .select(
      `
      id,
      name,
      start_at,
      currency,
      buyer_id,
      type,
      usage,
      lot_number,
      lot_name,
      profiles!buyer_id(
        first_name,
        last_name,
        email,
        companies(name)
      )
    `
    )
    .eq('id', auctionId)
    .single()

  if (auctionError || !auction) {
    console.warn(
      `[PDF Auth] User ${user.id} (${user.email}) attempted unauthorized access to auction ${auctionId}`,
      auctionError
    )
    throw createError({
      statusCode: 403,
      statusMessage: 'Access denied. You do not have permission to export this auction.'
    })
  }

  // Determine user role for logging
  const isBuyer = auction.buyer_id === user.id
  console.log(
    `[PDF Auth] User ${user.id} (${user.email}) authorized for auction ${auctionId} (${isBuyer ? 'buyer' : 'seller'})`
  )

  return auction
}

/**
 * Full authentication and authorization flow
 * @param {H3Event} event - Nuxt event object
 * @param {string} auctionId - Auction ID
 * @returns {Promise<{user: Object, token: string, auction: Object, userSupabase: SupabaseClient}>}
 */
export async function authenticateAndAuthorize(event, auctionId) {
  // Step 1: Authenticate user
  const { user, token } = await authenticateUser(event)

  // Step 2: Create user Supabase client with RLS
  const userSupabase = await createUserSupabaseClient(token)

  // Step 3: Authorize access to auction
  const auction = await authorizeAuctionAccess(userSupabase, auctionId, user)

  return { user, token, auction, userSupabase }
}
