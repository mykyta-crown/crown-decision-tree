/**
 * Tests for PDF Generation Data Fetcher
 *
 * Run with: npm test dataFetcher.test.js
 */

import { describe, it, expect } from 'vitest'
import { processLotsWithBids, prepareAuctionData } from '../dataFetcher.js'

describe('processLotsWithBids', () => {
  it('should process lots without bids', () => {
    const lots = [
      { id: 'lot1', name: 'Lot 1' },
      { id: 'lot2', name: 'Lot 2' }
    ]
    const bids = []

    const result = processLotsWithBids(lots, bids)

    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'lot1',
      name: 'Lot 1',
      lowestBid: undefined,
      lowestBidder: 'N/A'
    })
  })

  it('should process lots with bids', () => {
    const lots = [{ id: 'lot1', name: 'Lot 1' }]
    const bids = [
      {
        auction_id: 'lot1',
        price: 100,
        profiles: { companies: { name: 'Company A' } }
      },
      {
        auction_id: 'lot1',
        price: 120,
        profiles: { companies: { name: 'Company B' } }
      }
    ]

    const result = processLotsWithBids(lots, bids)

    expect(result[0].lowestBid).toBe(100)
    expect(result[0].lowestBidder).toBe('Company A')
  })

  it('should handle missing company name', () => {
    const lots = [{ id: 'lot1', name: 'Lot 1' }]
    const bids = [
      {
        auction_id: 'lot1',
        price: 100,
        profiles: null
      }
    ]

    const result = processLotsWithBids(lots, bids)

    expect(result[0].lowestBidder).toBe('N/A')
  })
})

describe('prepareAuctionData', () => {
  it('should prepare auction data with all fields', () => {
    const auction = {
      id: '123',
      name: 'Test Auction',
      auctions_group_settings: { name: 'Group A' },
      profiles: {
        first_name: 'John',
        last_name: 'Doe',
        companies: { name: 'Acme Corp' }
      }
    }

    const result = prepareAuctionData(auction)

    expect(result).toEqual({
      auction,
      groupName: 'Group A',
      buyerProfile: 'John Doe',
      clientCompany: 'Acme Corp'
    })
  })

  it('should handle missing profile data', () => {
    const auction = {
      id: '123',
      name: 'Test Auction',
      auctions_group_settings: null,
      profiles: null
    }

    const result = prepareAuctionData(auction)

    expect(result).toEqual({
      auction,
      groupName: undefined,
      buyerProfile: null,
      clientCompany: undefined
    })
  })

  it('should handle partial profile data', () => {
    const auction = {
      id: '123',
      name: 'Test Auction',
      profiles: {
        first_name: 'John',
        last_name: null
      }
    }

    const result = prepareAuctionData(auction)

    expect(result.buyerProfile).toBe('John')
  })
})
