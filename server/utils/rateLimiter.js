/**
 * Rate Limiter Utility
 * Simple in-memory rate limiter for API endpoints
 *
 * For production at scale, consider using Redis instead of in-memory storage
 */

/**
 * Rate limiter configuration
 */
const DEFAULT_CONFIG = {
  limit: 5, // Max requests
  window: 60 * 1000 // Time window in milliseconds (1 minute)
}

/**
 * H3 middleware-style rate limiter
 * Uses lazy cleanup (no setInterval to avoid blocking Vercel build)
 * @param {object} options - Rate limiter options
 * @returns {Function} - Middleware function
 */
export function createRateLimiter(options = {}) {
  // Store rate limit data in memory
  // Structure: Map<key, number[]> where number[] is array of timestamps
  const hits = new Map()

  return async (event, keyFn) => {
    const key = typeof keyFn === 'function' ? await keyFn(event) : keyFn

    if (!key) {
      console.warn('[Rate Limiter] No key provided, skipping rate limit check')
      return { allowed: true }
    }

    const config = { ...DEFAULT_CONFIG, ...options }
    const now = Date.now()

    // Get existing hits for this key
    const arr = hits.get(key) ?? []

    // Lazy cleanup - remove timestamps outside the window
    const fresh = arr.filter((t) => now - t < config.window)

    // Check if limit exceeded
    if (fresh.length >= config.limit) {
      const oldestHit = fresh[0]
      const retryAfter = Math.ceil((oldestHit + config.window - now) / 1000)

      // Set rate limit headers
      setResponseHeaders(event, {
        'X-RateLimit-Limit': config.limit,
        'X-RateLimit-Remaining': 0,
        'X-RateLimit-Reset': oldestHit + config.window,
        'Retry-After': retryAfter
      })

      throw createError({
        statusCode: 429,
        statusMessage: `Too many requests. Please try again in ${retryAfter} seconds.`
      })
    }

    // Add current timestamp
    fresh.push(now)
    hits.set(key, fresh)

    // Set rate limit headers
    setResponseHeaders(event, {
      'X-RateLimit-Limit': config.limit,
      'X-RateLimit-Remaining': config.limit - fresh.length,
      'X-RateLimit-Reset': now + config.window
    })

    return {
      allowed: true,
      remaining: config.limit - fresh.length,
      resetAt: now + config.window
    }
  }
}

/**
 * Reset rate limit for a specific key (useful for testing)
 * Note: This function is kept for backward compatibility but requires access to the limiter instance
 * @deprecated Use the limiter instance directly instead
 */
export function resetRateLimit(key) {
  console.warn('[Rate Limiter] resetRateLimit is deprecated. Create limiter instances in handlers.')
}

/**
 * Get current rate limit status without incrementing
 * Note: This function is kept for backward compatibility but requires access to the limiter instance
 * @deprecated Use the limiter instance directly instead
 */
export function getRateLimitStatus(key) {
  console.warn(
    '[Rate Limiter] getRateLimitStatus is deprecated. Create limiter instances in handlers.'
  )
  const now = Date.now()
  return {
    count: 0,
    remaining: DEFAULT_CONFIG.limit,
    resetAt: now + DEFAULT_CONFIG.window
  }
}
