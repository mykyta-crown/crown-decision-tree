/**
 * PDF Export Data Fetching Utilities
 * Handles all database queries and data preparation for PDF generation
 */

import { resolveLocale, translateAuctionType, formatCoverDate, parseSupplierCount } from './helpers'

/**
 * Fetch supplier count for auction
 * @param {SupabaseClient} supabase - Supabase client
 * @param {string} auctionId - Auction ID
 * @returns {Promise<number|undefined>} - Supplier count
 */
export async function fetchSupplierCount(supabase, auctionId) {
  try {
    const { count, error } = await supabase
      .from('auctions_sellers')
      .select('id', { count: 'exact', head: true })
      .eq('auction_id', auctionId)

    if (error) {
      console.warn(`[PDF Data] Failed to fetch supplier count: ${error.message}`)
      return undefined
    }

    return typeof count === 'number' ? count : undefined
  } catch (error) {
    console.error(`[PDF Data] Supplier count query failed: ${error}`)
    return undefined
  }
}

/**
 * Prepare cover page data from auction and metadata
 * @param {Object} auction - Auction data from database
 * @param {Object} metadata - Client metadata
 * @param {SupabaseClient} supabase - Supabase client for additional queries
 * @returns {Promise<Object>} - Cover page data
 */
export async function prepareCoverPageData(auction, metadata, supabase) {
  const locale = resolveLocale(
    metadata?.cover?.locale || metadata?.locale || metadata?.language || metadata?.cover?.language
  )

  const rawAuctionType =
    metadata?.cover?.auctionType ||
    metadata?.auctionType ||
    metadata?.cover?.type ||
    metadata?.type ||
    auction.type ||
    auction.usage ||
    ''

  const metadataDate =
    metadata?.cover?.date || metadata?.date || metadata?.cover?.eventDate || metadata?.eventDate

  const metadataSupplierCount =
    metadata?.cover?.supplierCount ??
    metadata?.supplierCount ??
    metadata?.cover?.numberOfSuppliers ??
    metadata?.numberOfSuppliers

  let supplierCount = parseSupplierCount(metadataSupplierCount)

  // Fetch from database if not provided
  if (supplierCount === undefined) {
    supplierCount = await fetchSupplierCount(supabase, auction.id)
  }

  const eventDateSource = metadataDate || auction.start_at || new Date().toISOString()
  const formattedDate = formatCoverDate(eventDateSource, locale)

  let auctionTypeLabel = translateAuctionType(rawAuctionType, locale)
  const metadataAuctionTypeLabel = metadata?.cover?.auctionTypeLabel ?? metadata?.auctionTypeLabel

  if (metadataAuctionTypeLabel !== undefined && metadataAuctionTypeLabel !== null) {
    const trimmedLabel = String(metadataAuctionTypeLabel).trim()
    if (trimmedLabel.length > 0) {
      auctionTypeLabel = trimmedLabel
    }
  }

  return {
    auctionName: auction.name || 'eAuction',
    date: eventDateSource,
    formattedDate,
    client: auction.profiles?.companies?.name || 'N/A',
    buyer: auction.profiles
      ? `${auction.profiles.first_name || ''} ${auction.profiles.last_name || ''}`.trim()
      : 'N/A',
    currency: auction.currency || 'EUR',
    locale,
    auctionType: rawAuctionType,
    auctionTypeLabel,
    supplierCount
  }
}
