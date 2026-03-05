import { defineCollection, z } from '@nuxt/content'

export const collections = {
  // Define collections for each language and page
  en: defineCollection({
    type: 'data',
    schema: z.any() // Allow any JSON structure for translations
  }),
  fr: defineCollection({
    type: 'data',
    schema: z.any() // Allow any JSON structure for translations
  }),
  // Also define specific page collections
  dashboard: defineCollection({
    type: 'data',
    schema: z.any()
  }),
  home: defineCollection({
    type: 'data',
    schema: z.any()
  })
}
