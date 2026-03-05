export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const visitorId = query.visitorId

  if (!visitorId || typeof visitorId !== 'string') {
    throw createError({ statusCode: 400, statusMessage: 'Missing visitorId query param' })
  }

  const { intercomAccessToken } = useRuntimeConfig()
  if (!intercomAccessToken) {
    throw createError({ statusCode: 500, statusMessage: 'Intercom access token not configured' })
  }

  // Intercom Contacts API supports searching by external_id or email. For anonymous visitors,
  // their identifier is stored as anonymous_id. We query via Search endpoint.
  const url = 'https://api.intercom.io/visitors?user_id=' + visitorId

  const contact = await $fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${intercomAccessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
      'Intercom-Version': '2.14'
    }
  })
  console.log('contact from intercom', contact)

  return {
    contact
  }
})
