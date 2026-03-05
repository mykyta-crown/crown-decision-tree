import { serverSupabaseClient } from '#supabase/server'
import adminSupabase from '../../../utils/supabase'

/**
 * PDF Export API (server-only, Node runtime on Vercel)
 *
 * Flow:
 * 1. Client uploads images to Supabase Storage (pdf-temp bucket)
 * 2. Client sends storage paths (not base64 data) to this endpoint
 * 3. Server downloads images from storage
 * 4. Server generates PDF
 * 5. Server deletes temp images from storage
 * 6. Server returns PDF to client
 *
 * This avoids Vercel's 4.5MB request body limit.
 */

export const config = {
  runtime: 'nodejs20.x',
  memory: 3008,
  maxDuration: 120 // Increased for download + generation + cleanup
}

/**
 * Download image from Supabase Storage and convert to base64 data URL
 * @param {string} storagePath - Path in pdf-temp bucket
 * @returns {Promise<string>} - Base64 data URL
 */
async function downloadImageFromStorage(storagePath) {
  const { data, error } = await adminSupabase.storage.from('pdf-temp').download(storagePath)

  if (error) {
    // Supabase storage errors have different structures - extract message properly
    const errorMessage = error.message || error.error || error.statusCode || JSON.stringify(error)
    console.error(`[PDF Export] Failed to download ${storagePath}:`, errorMessage, error)
    throw new Error(`Failed to download image from ${storagePath}: ${errorMessage}`)
  }

  if (!data) {
    console.error(`[PDF Export] No data returned for ${storagePath}`)
    throw new Error(`Failed to download image from ${storagePath}: No data returned`)
  }

  // Convert blob to base64 data URL
  const arrayBuffer = await data.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const base64 = buffer.toString('base64')
  const mimeType = data.type || 'image/jpeg'

  return `data:${mimeType};base64,${base64}`
}

/**
 * Cleanup temp images from storage
 * @param {string[]} paths - Array of storage paths to delete
 */
async function cleanupTempImages(paths) {
  if (!paths || paths.length === 0) return

  console.log(`[PDF Export] Cleaning up ${paths.length} temp images...`)
  try {
    const { error } = await adminSupabase.storage.from('pdf-temp').remove(paths)
    if (error) {
      console.warn('[PDF Export] Cleanup warning:', error.message)
    } else {
      console.log('[PDF Export] Cleanup completed successfully')
    }
  } catch (err) {
    console.warn('[PDF Export] Cleanup failed:', err)
    // Don't throw - cleanup failure shouldn't break the response
  }
}

export default defineEventHandler(async (event) => {
  // --- SANITIZE ENV (avant tout import) ---
  for (const k of [
    'CHROMIUM_PATH',
    'PUPPETEER_EXECUTABLE_PATH',
    'GOOGLE_CHROME_BIN',
    'GOOGLE_CHROME_PATH',
    'GOOGLE_CHROME_SHIM',
    'PLAYWRIGHT_BROWSERS_PATH',
    'PUPPETEER_CACHE_DIR'
  ])
    delete process.env[k]
  process.env.CHROMIUM_CHANNEL = 'stable'

  const auctionId = event.context.params.auctionId
  console.log(`[PDF Export] Request received for auction: ${auctionId}`)

  // Track paths for cleanup
  const pathsToCleanup = []

  try {
    // Imports dynamiques APRES sanitize
    const [
      { authenticateAndAuthorize },
      { prepareCoverPageData },
      { generatePdf },
      { sanitizeFilename },
      { createRateLimiter }
    ] = await Promise.all([
      import('../../../utils/pdf/auth'),
      import('../../../utils/pdf/data'),
      import('../../../utils/pdf/generation'),
      import('../../../utils/pdf/helpers'),
      import('../../../utils/rateLimiter')
    ])

    // Rate limiter (5/min)
    const rateLimiter = createRateLimiter({ limit: 5, window: 60 * 1000 })
    const { user, token, auction, userSupabase } = await authenticateAndAuthorize(event, auctionId)
    await rateLimiter(event, `pdf-export:${user.id}`)

    // Body - now expects imageRefs (storage paths) instead of base64 data
    const body = await readBody(event)
    if (!body || !Array.isArray(body.imageRefs)) {
      throw createError({
        statusCode: 400,
        statusMessage:
          'Invalid request body. Expected { imageRefs: Array, exportSessionId: string, metadata?: Object }'
      })
    }
    const { imageRefs, exportSessionId, metadata = {} } = body
    if (imageRefs.length === 0) {
      throw createError({ statusCode: 400, statusMessage: 'No images provided for PDF generation' })
    }

    // Validation
    const MAX_IMAGES = 500
    if (imageRefs.length > MAX_IMAGES) {
      throw createError({
        statusCode: 400,
        statusMessage: `Too many images (${imageRefs.length}). Max: ${MAX_IMAGES}`
      })
    }

    console.log(`[PDF Export] Processing ${imageRefs.length} image references...`)
    console.log(`[PDF Export] Export session: ${exportSessionId}`)

    // Download images from storage and convert to the format expected by generatePdf
    const images = []
    for (const ref of imageRefs) {
      if (ref.storagePath) {
        // Image stored in Supabase Storage - download it
        console.log(`[PDF Export] Downloading: ${ref.storagePath}`)
        const base64Data = await downloadImageFromStorage(ref.storagePath)
        pathsToCleanup.push(ref.storagePath)

        images.push({
          data: base64Data,
          title: ref.title,
          lotContext: ref.lotContext
        })
      } else if (ref.lotData) {
        // Server-generated page (like Lot Separator) - no image data
        images.push({
          data: '', // Empty = server will generate HTML
          title: ref.title,
          lotData: ref.lotData
        })
      }
    }

    console.log(`[PDF Export] Downloaded ${pathsToCleanup.length} images from storage`)

    // Data page de garde
    const coverPageData = await prepareCoverPageData(auction, metadata, userSupabase)

    // Génération PDF
    const pdfBuffer = await generatePdf(images, coverPageData, {
      auctionId,
      auctionName: auction.name,
      pdfOptions: {
        // tu peux override des options ici si besoin
      }
    })

    // Cleanup temp images AFTER successful PDF generation
    await cleanupTempImages(pathsToCleanup)

    const filename = sanitizeFilename(`auction-${auction.name}-${Date.now()}`) + '.pdf'
    setResponseHeaders(event, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Length': String(pdfBuffer.length)
    })
    return pdfBuffer
  } catch (error) {
    // Cleanup on error as well
    if (pathsToCleanup.length > 0) {
      console.log('[PDF Export] Cleaning up after error...')
      await cleanupTempImages(pathsToCleanup)
    }

    if (error?.statusCode) {
      console.error(`[PDF Export] Error ${error.statusCode}: ${error.statusMessage}`)
      throw error
    }
    console.error('[PDF Export] Unexpected error:', error)
    throw createError({
      statusCode: 500,
      statusMessage: `PDF generation failed: ${error?.message || String(error)}`
    })
  }
})
