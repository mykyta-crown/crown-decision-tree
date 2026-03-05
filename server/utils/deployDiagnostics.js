/**
 * Diagnostic helpers to log deployment/runtime metadata per request.
 */

/**
 * Log Vercel/Nitro runtime hints to help debug latency differences
 * between local and deployed review apps.
 *
 * @param {H3Event} event
 * @param {string} label - context label for the log line
 */
export function logDeploymentContext(event, label = 'deployment') {
  try {
    const headers = getRequestHeaders(event) || {}
    const vercelId = headers['x-vercel-id']

    const logPayload = {
      label,
      vercel: !!process.env.VERCEL,
      vercelEnv: process.env.VERCEL_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      vercelUrl: process.env.VERCEL_URL,
      nitroPreset: process.env.NITRO_PRESET,
      edgeRuntime: process.env.NEXT_RUNTIME || process.env.NITRO_EDGE,
      waitUntilSupported: !!event?.context?.waitUntil || !!event?.waitUntil,
      requestRegion: vercelId?.split(':')?.[0],
      requestId: vercelId || headers['x-request-id']
    }

    console.log('🚦 Deployment diagnostics', logPayload)
  } catch (error) {
    console.warn('⚠️ Failed to log deployment diagnostics', { label, error: error.message })
  }
}
