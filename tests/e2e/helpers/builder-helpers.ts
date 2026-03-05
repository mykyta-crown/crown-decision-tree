/**
 * Builder test helpers
 * Utilities for generating test data for auction builder E2E tests
 */

export interface TestAuctionBasics {
  name: string
  type: 'reverse' | 'dutch' | 'japanese' | 'sealed-bid'
  description?: string
  date?: string
  time?: string
}

export interface TestSupplier {
  email: string
  phone: string
}

export interface TestLineItem {
  name: string
  unit: string
  quantity: number
  prices: Record<string, number>
}

export interface TestLot {
  name: string
  baseline: number
  duration?: number
  min_bid_decr?: number
  max_bid_decr?: number
  overtime_range?: number
  items: TestLineItem[]
}

export interface TestAuctionData {
  basics: TestAuctionBasics
  suppliers: TestSupplier[]
  lots: TestLot[]
}

/**
 * Generate test auction data for a specific type
 */
export function generateTestAuctionData(
  type: 'reverse' | 'dutch' | 'japanese' | 'sealed-bid'
): TestAuctionData {
  const timestamp = Date.now()

  const baseData: TestAuctionData = {
    basics: {
      name: `Test ${type} Auction ${timestamp}`,
      type,
      description: `Test auction for ${type} type`
    },
    suppliers: [
      { email: 'supplier+1@crown.ovh', phone: '+33612345678' },
      { email: 'supplier+2@crown.ovh', phone: '+33612345679' }
    ],
    lots: []
  }

  // Type-specific lot configuration
  switch (type) {
    case 'reverse': // English auction
      baseData.lots.push({
        name: 'Lot 1',
        baseline: 1000,
        duration: 15,
        min_bid_decr: 10,
        max_bid_decr: 100,
        overtime_range: 1,
        items: [
          {
            name: 'Widget A',
            unit: 'piece',
            quantity: 100,
            prices: {
              'supplier+1@crown.ovh': 10,
              'supplier+2@crown.ovh': 12
            }
          }
        ]
      })
      break

    case 'sealed-bid':
      baseData.lots.push({
        name: 'Lot 1',
        baseline: 1000,
        duration: 0, // Sealed bid has no duration
        min_bid_decr: 0,
        max_bid_decr: 0,
        overtime_range: 0,
        items: [
          {
            name: 'Service Package',
            unit: 'package',
            quantity: 1,
            prices: {
              'supplier+1@crown.ovh': 5000,
              'supplier+2@crown.ovh': 5500
            }
          }
        ]
      })
      break

    case 'dutch':
      baseData.lots.push({
        name: 'Lot 1',
        baseline: 1000,
        duration: 10, // 10 minutes
        min_bid_decr: 10, // Round increment
        max_bid_decr: 500, // Ending price
        overtime_range: 1, // 1 minute per round
        items: [
          {
            name: 'Product X',
            unit: 'unit',
            quantity: 50,
            prices: {
              'supplier+1@crown.ovh': 12,
              'supplier+2@crown.ovh': 13
            }
          }
        ]
      })
      break

    case 'japanese':
      baseData.lots.push({
        name: 'Lot 1',
        baseline: 1000,
        duration: 15, // 15 minutes
        min_bid_decr: 20, // Round decrement
        max_bid_decr: 2000, // Starting price
        overtime_range: 1, // 1 minute per round
        items: [
          {
            name: 'Component Y',
            unit: 'piece',
            quantity: 200,
            prices: {
              'supplier+1@crown.ovh': 8,
              'supplier+2@crown.ovh': 9
            }
          }
        ]
      })
      break
  }

  return baseData
}

/**
 * Generate unique test email with timestamp
 */
export function generateTestAuctionName(type: string): string {
  return `Test ${type} ${Date.now()}`
}

/**
 * Calculate expected starting price for Dutch auction
 * Formula: max_bid_decr - (nbRounds - 1) * min_bid_decr
 */
export function calculateDutchStartingPrice(
  endingPrice: number,
  roundIncrement: number,
  duration: number,
  roundDuration: number
): number {
  const nbRounds = duration / roundDuration
  return endingPrice - (nbRounds - 1) * roundIncrement
}

/**
 * Calculate expected ending price for Japanese auction
 * Formula: max_bid_decr - (nbRounds - 1) * min_bid_decr
 */
export function calculateJapaneseEndingPrice(
  startingPrice: number,
  roundDecrement: number,
  duration: number,
  roundDuration: number
): number {
  const nbRounds = duration / roundDuration
  return startingPrice - (nbRounds - 1) * roundDecrement
}

/**
 * Calculate number of rounds for Dutch/Japanese auctions
 */
export function calculateNumberOfRounds(duration: number, roundDuration: number): number {
  return duration / roundDuration
}
