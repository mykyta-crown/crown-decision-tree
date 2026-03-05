import * as Sentry from '@sentry/nuxt'

// Utiliser useRuntimeConfig pour accéder aux variables publiques côté client
const config = useRuntimeConfig()

// Ne pas initialiser Sentry uniquement en développement local
// Sur Vercel, vercelEnv sera 'production', 'preview' ou 'development'
// En local avec npm run dev, vercelEnv sera undefined
const isVercelDeployment = !!config.public.vercelEnv
const isLocalDevelopment = !isVercelDeployment && import.meta.dev

if (!isLocalDevelopment && config.public.sentryDsn) {
  Sentry.init({
    dsn: config.public.sentryDsn,

    // Environment de l'application (production, preview, development)
    environment: config.public.sentryEnvironment || config.public.vercelEnv || 'development',

    // Taux d'échantillonnage des traces de performance (10% en production)
    tracesSampleRate: config.public.vercelEnv === 'production' ? 0.1 : 1.0,

    // Taux d'échantillonnage des sessions de replay (10% des sessions, 100% des sessions avec erreurs)
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,

    // Intégration du Session Replay pour enregistrer les sessions utilisateur
    integrations: [
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true
      })
    ],

    // Ignorer certaines erreurs courantes
    ignoreErrors: [
      // Erreurs réseau courantes
      'Network request failed',
      'NetworkError',
      'Failed to fetch',
      // Erreurs de navigation
      'Navigation cancelled',
      'ChunkLoadError',
      // Erreurs de navigateur
      'ResizeObserver loop limit exceeded',
      'Non-Error promise rejection captured'
    ]
  })

  console.log('[Sentry] Monitoring enabled for', config.public.vercelEnv || 'deployment')
} else {
  console.log('[Sentry] Monitoring disabled for local development')
}
