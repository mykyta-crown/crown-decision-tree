/**
 * Rate Limiter Tests
 *
 * To run: npx vitest run server/utils/__tests__/rateLimiter.test.js
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { checkRateLimit, resetRateLimit, getRateLimitStatus } from '../rateLimiter'

describe('Rate Limiter', () => {
  beforeEach(() => {
    // Clean up before each test
    resetRateLimit('test-key')
  })

  it('should allow requests within limit', () => {
    const key = 'test-key'
    const config = { limit: 5, window: 60000 }

    // First 5 requests should be allowed
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key, config)
      expect(result.allowed).toBe(true)
      expect(result.remaining).toBe(4 - i)
    }
  })

  it('should block requests exceeding limit', () => {
    const key = 'test-key'
    const config = { limit: 3, window: 60000 }

    // First 3 requests allowed
    for (let i = 0; i < 3; i++) {
      const result = checkRateLimit(key, config)
      expect(result.allowed).toBe(true)
    }

    // 4th request should be blocked
    const blockedResult = checkRateLimit(key, config)
    expect(blockedResult.allowed).toBe(false)
    expect(blockedResult.remaining).toBe(0)
    expect(blockedResult.retryAfter).toBeGreaterThan(0)
  })

  it('should reset after time window', async () => {
    const key = 'test-key'
    const config = { limit: 2, window: 100 } // 100ms window for testing

    // Use up the limit
    checkRateLimit(key, config)
    checkRateLimit(key, config)

    // Should be blocked
    let result = checkRateLimit(key, config)
    expect(result.allowed).toBe(false)

    // Wait for window to expire
    await new Promise((resolve) => setTimeout(resolve, 150))

    // Should be allowed again
    result = checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })

  it('should track different keys independently', () => {
    const config = { limit: 2, window: 60000 }

    // Use up limit for key1
    checkRateLimit('key1', config)
    checkRateLimit('key1', config)

    // key1 should be blocked
    const result1 = checkRateLimit('key1', config)
    expect(result1.allowed).toBe(false)

    // key2 should still be allowed
    const result2 = checkRateLimit('key2', config)
    expect(result2.allowed).toBe(true)
  })

  it('should get current status without incrementing', () => {
    const key = 'test-key'
    const config = { limit: 5, window: 60000 }

    // Make 2 requests
    checkRateLimit(key, config)
    checkRateLimit(key, config)

    // Check status multiple times (should not increment)
    const status1 = getRateLimitStatus(key)
    const status2 = getRateLimitStatus(key)
    const status3 = getRateLimitStatus(key)

    expect(status1.count).toBe(2)
    expect(status2.count).toBe(2)
    expect(status3.count).toBe(2)
    expect(status1.remaining).toBe(3)
  })

  it('should reset rate limit for specific key', () => {
    const key = 'test-key'
    const config = { limit: 2, window: 60000 }

    // Use up the limit
    checkRateLimit(key, config)
    checkRateLimit(key, config)

    // Should be blocked
    let result = checkRateLimit(key, config)
    expect(result.allowed).toBe(false)

    // Reset manually
    resetRateLimit(key)

    // Should be allowed again
    result = checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(1)
  })

  it('should use default config when not provided', () => {
    const key = 'test-key'

    // Should use default: 5 requests per 60 seconds
    for (let i = 0; i < 5; i++) {
      const result = checkRateLimit(key)
      expect(result.allowed).toBe(true)
    }

    // 6th request should be blocked
    const result = checkRateLimit(key)
    expect(result.allowed).toBe(false)
  })
})

describe('Rate Limiter - PDF Export Scenario', () => {
  it('should simulate real PDF export rate limiting', async () => {
    const userId = 'user-123'
    const key = `pdf-export:${userId}`
    const config = { limit: 5, window: 60000 } // 5 per minute

    console.log('\n📊 Simulating PDF export rate limiting for user:', userId)

    // User makes 5 successful exports
    for (let i = 1; i <= 5; i++) {
      const result = checkRateLimit(key, config)
      console.log(`Export #${i}: ✅ Allowed (${result.remaining} remaining)`)
      expect(result.allowed).toBe(true)
    }

    // 6th attempt should be blocked
    const blockedResult = checkRateLimit(key, config)
    console.log(`Export #6: ❌ Blocked - Retry after ${blockedResult.retryAfter}s`)
    expect(blockedResult.allowed).toBe(false)

    // User waits and tries again
    console.log('⏳ Waiting for rate limit to reset...')
    await new Promise((resolve) => setTimeout(resolve, 100))
    resetRateLimit(key) // Simulate time passing

    const afterResetResult = checkRateLimit(key, config)
    console.log(`Export #7: ✅ Allowed after reset (${afterResetResult.remaining} remaining)`)
    expect(afterResetResult.allowed).toBe(true)
  })
})
