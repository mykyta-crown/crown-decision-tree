/**
 * Sentry Data Sanitization Utilities
 * Filters sensitive data before sending to Sentry
 */

const SENSITIVE_FIELDS = [
  'password',
  'token',
  'authorization',
  'bearer',
  'x-vercel-oidc-token',
  'vercel_oidc_token',
  'api_key',
  'apikey',
  'secret',
  'private_key',
  'credit_card',
  'ssn',
  'social_security',
  'webhook_bearer_token',
  'supabase_admin_key'
]

/**
 * Sanitize an object by redacting sensitive fields
 * @param {Object|Array|any} obj - Object to sanitize
 * @param {number} depth - Current recursion depth (prevents deep recursion)
 * @returns {Object|Array|any} Sanitized object
 */
export function sanitizeData(obj, depth = 0) {
  // Prevent deep recursion
  if (depth > 5) return '[MAX_DEPTH]'
  if (!obj || typeof obj !== 'object') return obj

  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map((item) => sanitizeData(item, depth + 1))
  }

  // Handle objects
  const sanitized = {}
  for (const [key, value] of Object.entries(obj)) {
    const lowerKey = key.toLowerCase()

    // Check if key contains sensitive term
    if (SENSITIVE_FIELDS.some((field) => lowerKey.includes(field))) {
      sanitized[key] = '[REDACTED]'
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitizeData(value, depth + 1)
    } else {
      sanitized[key] = value
    }
  }

  return sanitized
}

/**
 * Sanitize HTTP headers by redacting sensitive ones
 * @param {Object} headers - Headers object
 * @returns {Object} Sanitized headers
 */
export function sanitizeHeaders(headers) {
  if (!headers || typeof headers !== 'object') return headers

  const sanitized = { ...headers }

  // Always redact these headers
  const REDACT_HEADERS = [
    'authorization',
    'x-vercel-oidc-token',
    'cookie',
    'x-supabase-auth',
    'x-api-key'
  ]

  for (const header of REDACT_HEADERS) {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]'
    }
  }

  return sanitized
}
