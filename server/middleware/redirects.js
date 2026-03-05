export default defineEventHandler((event) => {
  const config = useRuntimeConfig()
  if (getRequestURL(event).pathname === '/' && config.public.vercelEnv === 'production') {
    return sendRedirect(event, 'https://www.crown-procurement.com/', 301)
  }
})
