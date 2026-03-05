import dayjs from 'dayjs'

/**
 * Get auction status based on dates
 * Server-side version without composables
 */
export function getAuctionStatus(startAt, endAt, type = null) {
  const now = dayjs()
  const startDate = dayjs(startAt)

  if (type === 'sealed-bid') {
    const endDate = dayjs(endAt)
    return now.isAfter(endDate)
      ? { label: 'closed', color: 'sky' }
      : { label: 'active', color: 'grass' }
  }

  if (now.isAfter(startDate)) {
    const endDate = dayjs(endAt)
    return now.isAfter(endDate)
      ? { label: 'closed', color: 'sky' }
      : { label: 'active', color: 'grass' }
  }

  return { label: 'upcoming', color: 'yellow' }
}

/**
 * Validate auction data structure
 */
export function validateAuctionData(auction) {
  if (!auction) {
    throw new Error('Auction data is missing')
  }

  if (!auction.id) {
    throw new Error('Auction ID is missing')
  }

  return true
}

/**
 * Validate images data for PDF generation
 */
export function validateImagesData(images) {
  if (!images || !Array.isArray(images)) {
    throw new Error('Images must be an array')
  }

  if (images.length === 0) {
    throw new Error('No image data provided')
  }

  // Validate each image
  images.forEach((img, index) => {
    if (!img.data) {
      throw new Error(`Image ${index} is missing data`)
    }

    if (!img.data.startsWith('data:image/')) {
      throw new Error(`Image ${index} has invalid data format`)
    }
  })

  return true
}
