import * as Sentry from '@sentry/nuxt'

// Ne pas initialiser Sentry uniquement en développement local
// Sur Vercel, VERCEL_ENV sera 'production', 'preview' ou 'development'
// En local avec npm run dev, VERCEL_ENV sera undefined
const isVercelDeployment = !!process.env.VERCEL_ENV
const isLocalDevelopment = !isVercelDeployment && process.env.NODE_ENV === 'development'

if (!isLocalDevelopment && process.env.NUXT_PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.NUXT_PUBLIC_SENTRY_DSN,

    // Environment de l'application (production, preview, development)
    environment:
      process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT || process.env.VERCEL_ENV || 'development',

    // Taux d'échantillonnage des traces de performance (10% en production)
    tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,

    // Ignorer certaines erreurs courantes côté serveur
    ignoreErrors: ['ECONNRESET', 'ENOTFOUND', 'ETIMEDOUT']
  })

  console.log('[Sentry] Server monitoring enabled for', process.env.VERCEL_ENV || 'deployment')
} else {
  console.log('[Sentry] Server monitoring disabled for local development')
}
