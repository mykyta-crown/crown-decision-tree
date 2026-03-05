/**
 * Sentry Context Extraction Utilities
 * Extracts user and auction context for Sentry error reports
 */

import { serverSupabaseClient } from '#supabase/server'
import { fetchAuction } from '../fetcher'
import { auctionStatus } from '../miscs'

/**
 * Extract user context from Supabase auth session
 * @param {H3Event} event - Nitro event object
 * @returns {Promise<Object|null>} User context or null
 */
export async function extractUserContext(event) {
  try {
    const supabase = await serverSupabaseClient(event)
    const {
      data: { user }
    } = await supabase.auth.getUser()

    if (user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, role, company_id')
        .eq('id', user.id)
        .single()

      return {
        id: user.id,
        email: profile?.email || user.email,
        role: profile?.role,
        company_id: profile?.company_id
      }
    }

    return null
  } catch (err) {
    console.warn('[Sentry] Failed to extract user context:', err.message)
    return null
  }
}

/**
 * Extract auction context from URL params or request body
 * @param {H3Event} event - Nitro event object
 * @returns {Promise<Object|null>} Auction context or null
 */
export async function extractAuctionContext(event) {
  try {
    // Try extracting from URL params
    const params = event.context.params || {}
    let auctionId = params.auctionId

    if (!auctionId) {
      // Try extracting from request body
      try {
        const body = await readBody(event)
        if (body?.auction_id) {
          auctionId = body.auction_id
        } else if (body?.record?.auction_id) {
          // Handle webhook format
          auctionId = body.record.auction_id
        }
      } catch (err) {
        // Body already read or not available, skip
        return null
      }
    }

    if (!auctionId) {
      return null
    }

    // Fetch full auction details
    const { data: auction, error } = await fetchAuction(auctionId)

    if (error || !auction) {
      return { id: auctionId }
    }

    return {
      id: auction.id,
      type: auction.type,
      status: auctionStatus({ startAt: auction.start_at, endAt: auction.end_at }),
      usage: auction.usage
    }
  } catch (err) {
    console.warn('[Sentry] Failed to extract auction context:', err.message)
    return null
  }
}
