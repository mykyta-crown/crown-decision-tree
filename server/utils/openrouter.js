/**
 * OpenRouter Integration
 * Abstraction unifiée pour appeler les modèles OpenAI, Anthropic et Gemini via OpenRouter
 */

const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions'

/**
 * Model-specific configurations
 * Max tokens are set conservatively to balance quality and credit usage
 * The system will auto-retry with fewer tokens if credits are insufficient (402 error)
 */
const MODEL_CONFIGS = {
  // OpenAI models
  'openai/gpt-4-turbo': {
    maxTokens: 4096,
    contextWindow: 128000
  },
  'openai/gpt-4': {
    maxTokens: 4096,
    contextWindow: 8192
  },
  'openai/gpt-4o': {
    maxTokens: 8192,
    contextWindow: 128000
  },
  'openai/gpt-3.5-turbo': {
    maxTokens: 4096,
    contextWindow: 16385
  },
  'openai/gpt-5': {
    maxTokens: 16384,
    contextWindow: 200000,
    supportsReasoning: true
  },
  'openai/o3': {
    maxTokens: 100000,
    contextWindow: 200000,
    supportsReasoning: true
  },
  'openai/o1': {
    maxTokens: 100000,
    contextWindow: 200000,
    supportsReasoning: true
  },
  'openai/o1-pro': {
    maxTokens: 100000,
    contextWindow: 200000,
    supportsReasoning: true
  },
  // Anthropic models
  'anthropic/claude-3.5-sonnet': {
    maxTokens: 8192,
    contextWindow: 200000
  },
  'anthropic/claude-sonnet-4': {
    maxTokens: 16384,
    contextWindow: 200000
  },
  'anthropic/claude-sonnet-4.5': {
    maxTokens: 16384,
    contextWindow: 200000,
    supportsReasoning: true
  },
  'anthropic/claude-3-opus': {
    maxTokens: 4096,
    contextWindow: 200000
  },
  'anthropic/claude-3-sonnet': {
    maxTokens: 4096,
    contextWindow: 200000
  },
  'anthropic/claude-3-haiku': {
    maxTokens: 4096,
    contextWindow: 200000
  },
  // Google models
  'google/gemini-flash-1.5-8b': {
    maxTokens: 8192,
    contextWindow: 1000000
  },
  'google/gemini-2.0-flash-exp:free': {
    maxTokens: 8192,
    contextWindow: 1000000
  },
  'google/gemini-2.5-pro': {
    maxTokens: 16384,
    contextWindow: 2000000,
    supportsReasoning: true
  },
  'google/gemini-3-pro-preview': {
    maxTokens: 16384,
    contextWindow: 2000000,
    supportsReasoning: true
  },
  // Mistral models
  'mistralai/mistral-large': {
    maxTokens: 8192,
    contextWindow: 128000
  },
  'mistralai/mistral-large-2411': {
    maxTokens: 8192,
    contextWindow: 128000
  },
  'mistralai/mistral-medium-3.1': {
    maxTokens: 4096,
    contextWindow: 32000
  },
  'mistralai/mistral-small-3.2-24b-instruct-2506': {
    maxTokens: 4096,
    contextWindow: 32000
  },
  'mistralai/mistral-7b-instruct-v0.3': {
    maxTokens: 4096,
    contextWindow: 32768
  },
  'mistralai/mistral-7b-instruct': {
    maxTokens: 4096,
    contextWindow: 32768
  },
  // xAI models (Grok)
  'x-ai/grok-3': {
    maxTokens: 8192,
    contextWindow: 128000
  },
  'x-ai/grok-3-mini': {
    maxTokens: 8192,
    contextWindow: 128000,
    supportsReasoning: true
  },
  'x-ai/grok-4-fast': {
    maxTokens: 4096,
    contextWindow: 32000
  },
  'x-ai/grok-2': {
    maxTokens: 4096,
    contextWindow: 32000
  }
}

/**
 * Get optimal max_tokens for a given model
 * @param {string} model - Model identifier
 * @returns {number} - Optimal max_tokens value
 */
export function getMaxTokensForModel(model) {
  return MODEL_CONFIGS[model]?.maxTokens || 2048 // Conservative default to avoid 402 errors
}

/**
 * Get model configuration
 * @param {string} model - Model identifier
 * @returns {Object} - Model configuration
 */
export function getModelConfig(model) {
  return MODEL_CONFIGS[model] || { maxTokens: 2048, contextWindow: 8192 }
}

/**
 * Calcule une estimation du nombre de tokens dans un texte
 * Approximation: 1 token ≈ 4 caractères pour l'anglais, 2-3 pour le français
 * @param {string} text - Le texte à analyser
 * @returns {number} - Nombre estimé de tokens
 */
export function calculateTokens(text) {
  if (!text) return 0
  // Approximation conservative: 1 token ≈ 3 caractères
  return Math.ceil(text.length / 3)
}

/**
 * Parse OpenRouter 402 error to extract affordable tokens
 * @param {string} errorText - Error response text from OpenRouter
 * @returns {number|null} - Number of affordable tokens, or null if not a credit error
 */
function parseAffordableTokens(errorText) {
  try {
    const errorData = JSON.parse(errorText)
    const message = errorData.error?.message || ''

    // Extract "can only afford X" from error message
    const match = message.match(/can only afford (\d+)/)
    if (match) {
      return parseInt(match[1], 10)
    }
  } catch (e) {
    // Not JSON or parsing failed
  }
  return null
}

/**
 * Check if a model supports reasoning effort configuration
 * @param {string} model - Model identifier
 * @returns {boolean} - Whether the model supports reasoning
 */
export function modelSupportsReasoning(model) {
  const config = MODEL_CONFIGS[model]
  return config?.supportsReasoning === true
}

/**
 * Build reasoning config for models that support it
 * @param {string} model - Model identifier
 * @param {string} effort - Reasoning effort level: 'low', 'medium', 'high' (default: 'medium')
 * @returns {Object|null} - Reasoning config or null if model doesn't support it
 */
function getReasoningConfig(model, effort = 'medium') {
  // Check if model supports reasoning via config
  if (modelSupportsReasoning(model)) {
    return { effort }
  }
  return null
}

/**
 * Appelle OpenRouter avec streaming activé
 * @param {Object} params - Paramètres de l'appel
 * @param {string} params.model - Modèle à utiliser (ex: 'openai/gpt-4-turbo')
 * @param {Array} params.messages - Historique des messages
 * @param {string} params.systemPrompt - Instructions système (optionnel)
 * @param {number} params.maxTokens - Override max_tokens (optionnel)
 * @param {boolean} params.autoRetryWithFewerTokens - Auto-retry with fewer tokens on 402 (default: true)
 * @param {string} params.reasoningEffort - Reasoning effort for supported models: 'low', 'medium', 'high' (default: 'low')
 * @returns {Promise<Response>} - Response stream de fetch
 */
export async function callOpenRouterStream({
  model,
  messages,
  systemPrompt,
  maxTokens,
  autoRetryWithFewerTokens = true,
  reasoningEffort = 'low'
}) {
  const config = useRuntimeConfig()

  if (!config.openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  // Construire les messages avec system prompt si fourni
  const fullMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  // Utiliser maxTokens fourni, ou celui du modèle, ou défaut générique
  const tokensLimit = maxTokens || getMaxTokensForModel(model)

  // Build request body
  const requestBody = {
    model,
    messages: fullMessages,
    stream: true, // Activer le streaming SSE
    max_tokens: tokensLimit
  }

  // Add reasoning config for supported models (e.g., Gemini 2.5, OpenAI o-series)
  // IMPORTANT: include_reasoning: true is required to receive reasoning tokens in the response
  const reasoningConfig = getReasoningConfig(model, reasoningEffort)
  if (reasoningConfig) {
    requestBody.reasoning = reasoningConfig
    requestBody.include_reasoning = true
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openrouterApiKey}`,
      'HTTP-Referer': config.openrouterAppUrl || 'https://crown.ovh',
      'X-Title': config.openrouterAppName || 'Crown GPT',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  // Handle 402 error (insufficient credits) with auto-retry
  if (!response.ok && response.status === 402 && autoRetryWithFewerTokens) {
    const errorText = await response.text()
    const affordableTokens = parseAffordableTokens(errorText)

    if (affordableTokens && affordableTokens > 100) {
      // Retry with affordable tokens (minus 10% buffer for safety)
      const safeTokens = Math.floor(affordableTokens * 0.9)
      console.warn(
        `⚠️ Insufficient credits for ${tokensLimit} tokens. Retrying with ${safeTokens} tokens...`
      )

      // Recursive call with explicit token limit and no auto-retry
      return callOpenRouterStream({
        model,
        messages,
        systemPrompt,
        maxTokens: safeTokens,
        autoRetryWithFewerTokens: false // Prevent infinite retry loop
      })
    } else {
      // Not enough credits even for minimum response
      throw new Error(`OpenRouter API error (402): ${errorText}`)
    }
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`)
  }

  return response
}

/**
 * Appelle OpenRouter sans streaming (pour tests ou cas simples)
 * @param {Object} params - Paramètres de l'appel
 * @param {string} params.model - Modèle à utiliser
 * @param {Array} params.messages - Historique des messages
 * @param {string} params.systemPrompt - Instructions système (optionnel)
 * @param {number} params.maxTokens - Override max_tokens (optionnel)
 * @param {boolean} params.autoRetryWithFewerTokens - Auto-retry with fewer tokens on 402 (default: true)
 * @param {string} params.reasoningEffort - Reasoning effort for supported models: 'low', 'medium', 'high' (default: 'low')
 * @returns {Promise<Object>} - Réponse complète
 */
export async function callOpenRouter({
  model,
  messages,
  systemPrompt,
  maxTokens,
  autoRetryWithFewerTokens = true,
  reasoningEffort = 'low'
}) {
  const config = useRuntimeConfig()

  if (!config.openrouterApiKey) {
    throw new Error('OPENROUTER_API_KEY not configured')
  }

  const fullMessages = systemPrompt
    ? [{ role: 'system', content: systemPrompt }, ...messages]
    : messages

  // Utiliser maxTokens fourni, ou celui du modèle, ou défaut générique
  const tokensLimit = maxTokens || getMaxTokensForModel(model)

  // Build request body
  const requestBody = {
    model,
    messages: fullMessages,
    stream: false,
    max_tokens: tokensLimit
  }

  // Add reasoning config for supported models (e.g., Gemini 2.5, OpenAI o-series)
  // IMPORTANT: include_reasoning: true is required to receive reasoning tokens in the response
  const reasoningConfig = getReasoningConfig(model, reasoningEffort)
  if (reasoningConfig) {
    requestBody.reasoning = reasoningConfig
    requestBody.include_reasoning = true
  }

  const response = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.openrouterApiKey}`,
      'HTTP-Referer': config.openrouterAppUrl || 'https://crown.ovh',
      'X-Title': config.openrouterAppName || 'Crown GPT',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(requestBody)
  })

  // Handle 402 error (insufficient credits) with auto-retry
  if (!response.ok && response.status === 402 && autoRetryWithFewerTokens) {
    const errorText = await response.text()
    const affordableTokens = parseAffordableTokens(errorText)

    if (affordableTokens && affordableTokens > 100) {
      // Retry with affordable tokens (minus 10% buffer for safety)
      const safeTokens = Math.floor(affordableTokens * 0.9)
      console.warn(
        `⚠️ Insufficient credits for ${tokensLimit} tokens. Retrying with ${safeTokens} tokens...`
      )

      // Recursive call with explicit token limit and no auto-retry
      return callOpenRouter({
        model,
        messages,
        systemPrompt,
        maxTokens: safeTokens,
        autoRetryWithFewerTokens: false // Prevent infinite retry loop
      })
    } else {
      // Not enough credits even for minimum response
      throw new Error(`OpenRouter API error (402): ${errorText}`)
    }
  }

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenRouter API error (${response.status}): ${errorText}`)
  }

  return await response.json()
}

/**
 * All supported models via OpenRouter
 * Updated to include all configured models
 */
export const SUPPORTED_MODELS = {
  // OpenAI models
  GPT4_TURBO: 'openai/gpt-4-turbo',
  GPT4: 'openai/gpt-4',
  GPT4O: 'openai/gpt-4o',
  GPT35_TURBO: 'openai/gpt-3.5-turbo',
  GPT5: 'openai/gpt-5',
  O3: 'openai/o3',
  O1: 'openai/o1',
  O1_PRO: 'openai/o1-pro',

  // Anthropic models
  CLAUDE_35_SONNET: 'anthropic/claude-3.5-sonnet',
  CLAUDE_SONNET_4: 'anthropic/claude-sonnet-4',
  CLAUDE_SONNET_45: 'anthropic/claude-sonnet-4.5',
  CLAUDE_3_OPUS: 'anthropic/claude-3-opus',
  CLAUDE_3_SONNET: 'anthropic/claude-3-sonnet',
  CLAUDE_3_HAIKU: 'anthropic/claude-3-haiku',

  // Google models
  GEMINI_FLASH_15_8B: 'google/gemini-flash-1.5-8b',
  GEMINI_2_FLASH_FREE: 'google/gemini-2.0-flash-exp:free',
  GEMINI_25_PRO: 'google/gemini-2.5-pro',
  GEMINI_3_PRO_PREVIEW: 'google/gemini-3-pro-preview',

  // Mistral models
  MISTRAL_LARGE: 'mistralai/mistral-large',
  MISTRAL_LARGE_2411: 'mistralai/mistral-large-2411',
  MISTRAL_MEDIUM: 'mistralai/mistral-medium-3.1',
  MISTRAL_SMALL: 'mistralai/mistral-small-3.2-24b-instruct-2506',
  MISTRAL_7B: 'mistralai/mistral-7b-instruct-v0.3',

  // xAI models (Grok)
  GROK_3: 'x-ai/grok-3',
  GROK_3_MINI: 'x-ai/grok-3-mini',
  GROK_4_FAST: 'x-ai/grok-4-fast',
  GROK_2: 'x-ai/grok-2'
}

/**
 * Mapping des providers vers leurs modèles par défaut
 */
export const PROVIDER_DEFAULT_MODELS = {
  openai: SUPPORTED_MODELS.GPT4O,
  anthropic: SUPPORTED_MODELS.CLAUDE_SONNET_4,
  gemini: SUPPORTED_MODELS.GEMINI_25_PRO,
  google: SUPPORTED_MODELS.GEMINI_25_PRO,
  mistral: SUPPORTED_MODELS.MISTRAL_7B,
  xai: SUPPORTED_MODELS.GROK_3
}

/**
 * Export model configurations for external use
 */
export { MODEL_CONFIGS }
