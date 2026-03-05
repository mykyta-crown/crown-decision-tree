import { createClient } from '@supabase/supabase-js'

export default defineEventHandler(async (event) => {
  const { authorization } = getRequestHeaders(event)
  const config = useRuntimeConfig()

  // Get the expected webhook token from environment (required)
  const expectedToken = config.webhookBearerToken

  if (!expectedToken) {
    console.error('[Webhook users/insert] WEBHOOK_BEARER_TOKEN not configured')
    throw createError({
      statusCode: 500,
      statusMessage: 'Webhook authentication not configured'
    })
  }

  // We make sure that no one else than DB can edit an auction with webhooks.
  if (!authorization || authorization !== `Bearer ${expectedToken}`) {
    console.error('[Webhook users/insert] Unauthorized access attempt', {
      received: authorization ? 'Bearer ***' : 'none'
    })
    throw createError({
      statusCode: 401,
      statusMessage: 'Unauthorized'
    })
  }

  const body = await readBody(event)
  const { record: insertedUser } = body

  if (!insertedUser?.id || !insertedUser?.email) {
    console.error('[Webhook users/insert] Invalid payload:', JSON.stringify(body))
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid payload: missing id or email'
    })
  }

  // Use admin key to bypass RLS and ensure profile creation succeeds
  const supabase = createClient(config.public.supabase.url, config.supabaseAdminKey)

  console.log('[Webhook users/insert] Creating profile for user:', insertedUser.email)

  const { data, error } = await supabase
    .from('profiles')
    .insert([
      {
        id: insertedUser.id,
        email: insertedUser.email,
        is_active: true
      }
    ])
    .select()

  if (error) {
    console.error('[Webhook users/insert] Failed to create profile:', {
      userId: insertedUser.id,
      email: insertedUser.email,
      error: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code
    })
    throw createError({
      statusCode: 500,
      statusMessage: `Failed to create profile: ${error.message}`
    })
  }

  console.log('[Webhook users/insert] Successfully created profile:', {
    userId: insertedUser.id,
    email: insertedUser.email,
    profileId: data[0]?.id
  })

  return { success: true, profile: data[0] }
})
