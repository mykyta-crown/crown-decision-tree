import { update as intercomUpdate } from '@intercom/messenger-js-sdk'

// Global translation cache to prevent duplicate requests
const globalTranslationCache = new Map()
const pendingPromises = new Map()

export default function useTranslations(customRouteName = null) {
  // const { user } = useUser()
  // Use localStorage to persist locale across navigation
  const locale = useState('locale', () => {
    if (import.meta.client) {
      return localStorage.getItem('crown-locale') || 'en'
    }
    return 'en'
  })

  const route = useRoute()

  // Extract clean route name by removing locale suffix and mapping nested routes
  const cleanRouteName = computed(() => {
    const routeName = customRouteName || route.name?.toString() || 'index'

    // Remove locale suffix (e.g., 'dashboard___en' -> 'dashboard')
    const cleanName = routeName.replace(/___[a-z]{2}$/, '')

    // Map nested routes to their content file
    if (cleanName.startsWith('auctions-')) {
      return 'auctions'
    } else if (cleanName.startsWith('trainings-')) {
      return 'trainings'
    } else if (cleanName.startsWith('architect-') || cleanName === 'architect') {
      return 'architect'
    }
    return cleanName
  })

  // Load common translations with global cache
  const loadCommonTranslations = async (localeValue) => {
    const cacheKey = `common-${localeValue}`

    if (globalTranslationCache.has(cacheKey)) {
      return globalTranslationCache.get(cacheKey)
    }

    if (pendingPromises.has(cacheKey)) {
      return await pendingPromises.get(cacheKey)
    }

    const promise = (async () => {
      try {
        const result = await queryContent(`${localeValue}/common`).findOne()
        globalTranslationCache.set(cacheKey, result)
        return result
      } catch (error) {
        console.error('Error loading common translations:', error)
        return null
      } finally {
        pendingPromises.delete(cacheKey)
      }
    })()

    pendingPromises.set(cacheKey, promise)
    return await promise
  }

  // Load page-specific translations with global cache
  const loadPageTranslations = async (localeValue, routeName) => {
    const cacheKey = `page-${routeName}-${localeValue}`

    if (globalTranslationCache.has(cacheKey)) {
      return globalTranslationCache.get(cacheKey)
    }

    if (pendingPromises.has(cacheKey)) {
      return await pendingPromises.get(cacheKey)
    }

    const promise = (async () => {
      try {
        const result = await queryContent(`${localeValue}/${routeName}`).findOne()
        globalTranslationCache.set(cacheKey, result)
        return result
      } catch (error) {
        console.error('Error loading page translations:', error)
        return null
      } finally {
        pendingPromises.delete(cacheKey)
      }
    })()

    pendingPromises.set(cacheKey, promise)
    return await promise
  }

  // Sync access to cached translations (no reactivity)
  const commonTranslations = ref(globalTranslationCache.get(`common-${locale.value}`))
  const pageTranslations = ref(
    globalTranslationCache.get(`page-${cleanRouteName.value}-${locale.value}`)
  )
  const pending = ref(false)

  // Preload if not cached (happens once on app init)
  if (!commonTranslations.value) {
    pending.value = true
    loadCommonTranslations(locale.value).then((data) => {
      // console.log('data common', data)
      commonTranslations.value = data
      pending.value = false
    })
  }
  if (!pageTranslations.value) {
    pending.value = true
    loadPageTranslations(locale.value, cleanRouteName.value).then((data) => {
      // console.log('data page', data)
      pageTranslations.value = data
      pending.value = false
    })
  }

  watch(locale, () => {
    loadCommonTranslations(locale.value).then((data) => {
      commonTranslations.value = data
    })
    loadPageTranslations(locale.value, cleanRouteName.value).then((data) => {
      pageTranslations.value = data
    })
  })

  // Helper function to get nested value from object using dot notation
  const getNestedValue = (obj, path) => {
    if (!obj || typeof obj !== 'object') return null

    const keys = path.split('.')
    let value = obj

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key]
      } else {
        return null
      }
    }

    return value
  }

  // Translation function that checks page-specific first, then common translations
  const t = (key, variables = {}, fallback = '') => {
    // If still loading and no cached translations, return loading text or fallback
    if (pending.value && !pageTranslations.value && !commonTranslations.value) {
      if (process.env.NODE_ENV === 'development') {
        return 'DEV MODE MISSING TRANSLATION'
      } else {
        return fallback || 'Loading...'
      }
    }

    let translatedText = null

    // 1. Check page-specific overrides first (for component customizations)
    if (pageTranslations.value?.overrides?.[key]) {
      translatedText = pageTranslations.value.overrides[key]
    }

    // 2. Check page-specific translations from Nuxt Content
    if (translatedText === null) {
      const pageValue = getNestedValue(pageTranslations.value, key)
      if (pageValue !== null) {
        translatedText = pageValue
      }
    }

    // 3. Check common translations from Nuxt Content
    if (translatedText === null) {
      const commonValue = getNestedValue(commonTranslations.value, key)
      if (commonValue !== null) {
        translatedText = commonValue
      }
    }

    // If no translation found, use fallback
    if (translatedText === null) {
      if (fallback) {
        translatedText = fallback
      } else if (process.env.NODE_ENV === 'development') {
        translatedText = 'MISSING TRANSLATION'
      } else {
        translatedText = ''
      }
    }

    // Replace variables in the translated text
    if (typeof translatedText === 'string' && typeof variables === 'object' && variables !== null) {
      Object.keys(variables).forEach((variableName) => {
        const placeholder = `{${variableName}}`
        translatedText = translatedText.replace(
          new RegExp(placeholder, 'g'),
          variables[variableName]
        )
      })
    }

    return translatedText
  }

  // Number formatting function (like vue-i18n's $n)
  // Always uses en-US format regardless of locale
  const n = (value, options = {}) => {
    if (value === null || value === undefined) return ''
    const defaultOptions = { maximumFractionDigits: 2 }
    return new Intl.NumberFormat('en-US', { ...defaultOptions, ...options }).format(value)
  }

  // Function to switch language
  const switchLocale = async (newLocale) => {
    if (newLocale && (newLocale === 'en' || newLocale === 'fr')) {
      locale.value = newLocale
      // Persist to localStorage
      if (import.meta.client) {
        localStorage.setItem('crown-locale', newLocale)
      }

      // const intercomToken = await $fetch('/api/v1/intercom', {
      //   method: 'get',
      //   query: {
      //     userId: user.value.id
      //   }
      // })

      intercomUpdate({
        // intercom_user_jwt: intercomToken,
        language: newLocale,
        language_override: newLocale
      })
    }
  }

  return {
    t,
    n,
    locale: readonly(locale),
    switchLocale,
    pageTranslations,
    commonTranslations,
    pending
  }
}
