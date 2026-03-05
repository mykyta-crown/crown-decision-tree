/**
 * API Route: Translate text to target language
 * POST /api/translate
 *
 * Body: { texts: string[], targetLocale: 'en' | 'fr', context?: { name: string, instructions: string } }
 */

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const openrouterApiKey = config.openrouterApiKey

  // Read body
  const body = await readBody(event)
  const { texts, targetLocale = 'en', context } = body

  if (!texts || !Array.isArray(texts) || texts.length === 0) {
    throw createError({
      statusCode: 400,
      message: 'Missing required field: texts (array of strings)'
    })
  }

  // Validate locale
  const locale = ['en', 'fr'].includes(targetLocale) ? targetLocale : 'en'

  // Build context information if provided
  const contextInfo = context
    ? `\n\nContext: These texts are conversation starters for an AI assistant named "${context.name}".
${context.instructions ? `The assistant's role: ${context.instructions.substring(0, 200)}...` : ''}
Use appropriate professional terminology for the procurement/purchasing domain.`
    : ''

  // Build prompt for translation
  const languageName = locale === 'fr' ? 'French' : 'English'
  const systemPrompt = `You are a professional translator specializing in B2B procurement and supply chain terminology.
Translate the following texts to ${languageName}.
Keep the same tone, style, and professional register.${contextInfo}
Return ONLY a JSON array of translated strings in the same order, nothing else.
Example input: ["Hello", "How are you?"]
Example output: ["Bonjour", "Comment allez-vous ?"]`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${openrouterApiKey}`,
        'HTTP-Referer': process.env.VERCEL_URL || 'https://crown-app.vercel.app',
        'X-Title': 'Crown GPT'
      },
      body: JSON.stringify({
        model: 'openai/gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: JSON.stringify(texts)
          }
        ],
        temperature: 0.3, // Low temperature for consistent translations
        max_tokens: 500
      })
    })

    if (!response.ok) {
      console.error('Translation API error:', response.status)
      // Return original texts on error
      return { translations: texts }
    }

    const data = await response.json()
    const translatedText = data.choices?.[0]?.message?.content?.trim()

    if (translatedText) {
      try {
        const translations = JSON.parse(translatedText)
        if (Array.isArray(translations) && translations.length === texts.length) {
          return { translations }
        }
      } catch (parseError) {
        console.error('Failed to parse translation response:', parseError)
      }
    }

    // Return original texts if translation failed
    return { translations: texts }
  } catch (error) {
    console.error('Translation error:', error)
    return { translations: texts }
  }
})
