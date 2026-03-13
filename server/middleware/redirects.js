export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  const url = getRequestURL(event)
  const isPlayground = url.hostname.includes('playground')
  if (url.pathname === '/' && config.public.vercelEnv === 'production' && !isPlayground) {
    return sendRedirect(event, 'https://www.crown-procurement.com/', 301)
  }
})
