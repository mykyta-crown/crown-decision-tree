/**
 * Debug route: Afficher tous les cookies disponibles
 */

export default defineEventHandler(async (event) => {
  const cookies = parseCookies(event)
  const headers = getHeaders(event)

  return {
    cookies,
    headers,
    cookieKeys: Object.keys(cookies)
  }
})
