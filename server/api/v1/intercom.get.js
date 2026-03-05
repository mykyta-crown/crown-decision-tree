import jwt from 'jsonwebtoken'
import supabase from '~/server/utils/supabase'

export default defineEventHandler(async (event) => {
  const { userId } = getQuery(event)

  if (!userId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'userId is required'
    })
  }
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error || !profile) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Profile not found'
    })
  }

  const payload = {
    user_id: userId, // Required
    email: profile.email // Optional
  }

  const intercomSecret = process.env.INTERCOM_SECRET_KEY
  if (!intercomSecret) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Intercom secret key not configured'
    })
  }

  return jwt.sign(payload, intercomSecret, { expiresIn: '1h' })
})
