export default defineNuxtConfig({
  nitro: {
    preset: process.env.NITRO_PRESET || 'vercel',

    // Vercel function configuration - maxDuration for all serverless functions
    vercel: {
      functions: {
        maxDuration: 300 // 5 minutes for all functions
      }
    },

    serverAssets: [{ baseName: 'assets', dir: 'server/assets' }],

    prerender: { crawlLinks: false, routes: [] },

    externals: {
      inline: [],
      external: ['@sparticuz/chromium', 'puppeteer-core', 'mammoth']
    },
    moduleSideEffects: ['@sparticuz/chromium'],

    routeRules: {
      '/api/auctions/*/export-pdf': {
        isr: false,
        cache: false,
        experimentalNoEdge: true
      },
      '/api/conversations/*/send': {
        isr: false,
        cache: false
      },
      '/api/conversations/*/stream': {
        isr: false,
        cache: false
      }
    },
    imports: { dirs: ['server/utils/**'] },

    experimental: { database: true },
    database: {
      default: {
        connector: 'postgresql',
        options: { url: process.env.PG_URL }
      }
    }
  },

  runtimeConfig: {
    intercomAccessToken: process.env.INTERCOM_ACCESS_TOKEN,
    supabaseAdminKey: process.env.SUPABASE_ADMIN_KEY,
    webhookBearerToken: process.env.WEBHOOK_BEARER_TOKEN,
    openrouterApiKey: process.env.OPENROUTER_API_KEY,
    openrouterAppName: process.env.OPENROUTER_APP_NAME || 'Crown GPT',
    openrouterAppUrl: process.env.VERCEL_URL,
    public: {
      vercelEnv: process.env.VERCEL_ENV,
      sentryDsn: process.env.NUXT_PUBLIC_SENTRY_DSN,
      sentryEnvironment: process.env.NUXT_PUBLIC_SENTRY_ENVIRONMENT,
      enableIntercom: process.env.ENABLE_INTERCOM === 'true',
      intercomAppId: process.env.NUXT_PUBLIC_INTERCOM_APP_ID,
      supabase: {
        url: process.env.SUPABASE_URL,
        key: process.env.SUPABASE_ANON_KEY
      },
      supabaseUrl: process.env.SUPABASE_URL
    }
  },

  app: { pageTransition: { name: 'page', mode: 'out-in' } },
  ssr: false,
  devtools: { enabled: true },
  modules: [
    '@nuxt/eslint',
    'vuetify-nuxt-module',
    '@nuxt/content',
    '@nuxtjs/google-fonts',
    '@nuxt/scripts',
    '@nuxtjs/supabase',
    '@sentry/nuxt/module',
    '@pinia/nuxt'
  ],

  // Configuration Supabase
  supabase: {
    // Rediriger vers la page de login si non authentifié
    redirect: false, // Désactiver la redirection automatique - géré manuellement par le middleware
    // Configuration des cookies pour la persistance de session
    cookieName: 'sb',
    cookieOptions: {
      maxAge: 60 * 60 * 8, // 8 heures
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/'
    },
    // Configuration du client Supabase
    clientOptions: {
      auth: {
        flowType: 'pkce',
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        storage: undefined // Utiliser le storage par défaut (cookies via le module)
      }
    }
  },
  content: { preview: { api: 'https://api.nuxt.studio' } },
  googleFonts: {
    families: { Poppins: [400, 500, 700], Inter: [400, 500, 700] },
    'Noto Sans': [400]
  },
  css: ['~/assets/scss/main.scss', '~/assets/css/main.css'],
  experimental: { inlineSSRStyles: false },
  vuetify: {
    moduleOptions: {
      styles: { configFile: 'assets/scss/settings.scss' },
      includeTransformAssetsUrls: { NuxtImg: ['src'], OgImage: ['image'] }
    },
    vuetifyOptions: './vuetify.config.js'
  },

  // Configuration Sentry
  sentry: {
    sourceMapsUploadOptions: {
      org: 'crown-ib',
      project: 'crown',
      authToken: process.env.SENTRY_AUTH_TOKEN
    }
  },

  compatibilityDate: '2024-09-25',

  vite: {
    resolve: {
      extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
    },
    server: {
      allowedHosts: ['.ngrok-free.dev', '.ngrok.io', '.ngrok.app']
    },
    // Preserve console.log in production for debugging
    esbuild: {
      drop: [] // Don't drop console.log or debugger statements
    }
  },

  // Enable source maps for Sentry
  sourcemap: {
    server: true,
    client: 'hidden' // 'hidden' génère les source maps mais ne les expose pas au client
  }
})
