/**
 * PDF Export Helper Functions
 * Pure utility functions for data formatting and transformation
 */

// Auction type translations (static - more reliable on serverless)
const AUCTION_TYPE_TRANSLATIONS = {
  en: {
    english: 'English',
    dutch: 'Dutch',
    preferredDutch: 'Preferred Dutch',
    japanese: 'Japanese',
    japaneseNoRank: 'Japanese No Rank',
    sealedBid: 'Sealed Bid'
  },
  fr: {
    english: 'Anglaise',
    dutch: 'Hollandaise',
    preferredDutch: 'Hollandaise préférée',
    japanese: 'Japonaise',
    japaneseNoRank: 'Japonaise sans rang',
    sealedBid: 'Enchère scellée'
  }
}

const AUCTION_TYPE_SLUG_MAP = {
  'preferred-dutch': 'preferredDutch',
  'dutch-preferred': 'preferredDutch',
  dutch: 'dutch',
  english: 'english',
  'english-reverse': 'english',
  'reverse-english': 'english',
  reverse: 'english',
  'sealed-bid': 'sealedBid',
  sealedbid: 'sealedBid',
  'japanese-no-rank': 'japaneseNoRank',
  'japanese-norank': 'japaneseNoRank',
  japanese: 'japanese'
}

/**
 * Resolve locale to supported value
 * @param {string} inputLocale - Input locale string
 * @returns {string} - 'en' or 'fr'
 */
export function resolveLocale(inputLocale) {
  if (!inputLocale || typeof inputLocale !== 'string') {
    return 'en'
  }
  const normalized = inputLocale.toLowerCase()
  if (normalized.startsWith('fr')) {
    return 'fr'
  }
  if (normalized.startsWith('en')) {
    return 'en'
  }
  return 'en'
}

/**
 * Normalize auction type slug
 * @param {string} value - Auction type value
 * @returns {string} - Normalized slug
 */
export function normalizeAuctionTypeSlug(value) {
  if (!value) {
    return ''
  }
  return String(value)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-_]/g, '')
    .replace(/[\s_]+/g, '-')
}

/**
 * Translate auction type to display name
 * @param {string} rawType - Raw auction type
 * @param {string} locale - Locale ('en' or 'fr')
 * @returns {string} - Translated auction type
 */
export function translateAuctionType(rawType, locale = 'en') {
  if (!rawType) {
    return 'N/A'
  }
  const normalizedLocale = resolveLocale(locale)
  const translations = AUCTION_TYPE_TRANSLATIONS[normalizedLocale] || AUCTION_TYPE_TRANSLATIONS.en
  const slug = normalizeAuctionTypeSlug(rawType)
  let key = AUCTION_TYPE_SLUG_MAP[slug]

  if (!key) {
    if (slug.includes('preferred') && slug.includes('dutch')) {
      key = 'preferredDutch'
    } else if (slug.includes('dutch')) {
      key = 'dutch'
    } else if (slug.includes('sealed')) {
      key = 'sealedBid'
    } else if (slug.includes('english') || slug.includes('reverse')) {
      key = 'english'
    } else if (slug.includes('japanese') && slug.includes('no')) {
      key = 'japaneseNoRank'
    } else if (slug.includes('japanese')) {
      key = 'japanese'
    }
  }

  return translations[key] || String(rawType)
}

/**
 * Format date for cover page
 * @param {string|Date|number} dateInput - Date input
 * @param {string} locale - Locale ('en' or 'fr')
 * @returns {string} - Formatted date (DD.MM.YYYY)
 */
export function formatCoverDate(dateInput, locale = 'en') {
  if (!dateInput) {
    return 'N/A'
  }

  let normalizedInput = dateInput

  if (typeof dateInput === 'string') {
    const trimmed = dateInput.trim()

    if (trimmed === '') {
      return 'N/A'
    }

    if (/^\d{2}[./-]\d{2}[./-]\d{4}$/.test(trimmed)) {
      const [day, month, year] = trimmed.split(/[./-]/)
      normalizedInput = `${year}-${month}-${day}T00:00:00Z`
    } else if (/^\d{4}[./-]\d{2}[./-]\d{2}$/.test(trimmed)) {
      const [year, month, day] = trimmed.split(/[./-]/)
      normalizedInput = `${year}-${month}-${day}T00:00:00Z`
    } else if (/^\d{2}\s+\w+\s+\d{4}$/.test(trimmed)) {
      // Handle formats like "12 October 2025"
      normalizedInput = trimmed
    } else if (!Number.isNaN(Number(trimmed))) {
      normalizedInput = Number(trimmed)
    } else {
      normalizedInput = trimmed.replace(/\./g, '-')
    }
  }

  const date = new Date(normalizedInput)
  if (Number.isNaN(date.getTime())) {
    return 'N/A'
  }

  const resolvedLocale = resolveLocale(locale)
  const intlLocale = resolvedLocale === 'fr' ? 'fr-FR' : 'en-GB'

  try {
    const formatted = new Intl.DateTimeFormat(intlLocale, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'UTC'
    }).format(date)

    return formatted.replace(/[/-]/g, '.')
  } catch (error) {
    console.warn('[PDF Helpers] Failed to format cover date:', error.message)
    const day = String(date.getUTCDate()).padStart(2, '0')
    const month = String(date.getUTCMonth() + 1).padStart(2, '0')
    const year = String(date.getUTCFullYear())
    return `${day}.${month}.${year}`
  }
}

/**
 * Parse supplier count from various input formats
 * @param {any} value - Input value
 * @returns {number|undefined} - Parsed number or undefined
 */
export function parseSupplierCount(value) {
  if (value === null || value === undefined) {
    return undefined
  }

  if (typeof value === 'number' && Number.isFinite(value) && value >= 0) {
    return value
  }

  if (typeof value === 'string') {
    const trimmed = value.trim()

    if (trimmed === '') {
      return undefined
    }

    const directNumber = Number(trimmed)
    if (Number.isFinite(directNumber) && directNumber >= 0) {
      return directNumber
    }

    const digitMatch = trimmed.match(/(\d+([.,]\d+)?)/)
    if (digitMatch) {
      const normalized = digitMatch[1].replace(',', '.')
      const extractedNumber = Number(normalized)
      if (Number.isFinite(extractedNumber) && extractedNumber >= 0) {
        return extractedNumber
      }
    }
  }

  return undefined
}

/**
 * Sanitize filename for safe file system usage
 * @param {string} filename - Input filename
 * @param {number} maxLength - Maximum length
 * @returns {string} - Sanitized filename
 */
export function sanitizeFilename(filename, maxLength = 100) {
  return filename.replace(/[^a-z0-9_-]/gi, '_').substring(0, maxLength)
}
