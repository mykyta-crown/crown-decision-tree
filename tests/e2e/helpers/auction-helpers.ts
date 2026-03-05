/**
 * Auction database helpers
 * Utilities for verifying and managing auctions in E2E tests
 */

import { createClient } from '@supabase/supabase-js'
import { expect } from '@playwright/test'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export interface AuctionVerificationData {
  type: string
  name: string
  baseline: number
  supplierCount: number
  itemCount: number
}

/**
 * Get auction with all related data (sellers, supplies)
 */
export async function getAuction(auctionId: string) {
  const { data, error } = await supabaseAdmin
    .from('auctions')
    .select(
      `
      *,
      auctions_sellers(*),
      supplies(*, supplies_sellers(*))
    `
    )
    .eq('id', auctionId)
    .single()

  if (error) {
    throw new Error(`Failed to fetch auction: ${error.message}`)
  }

  return data
}

/**
 * Get auction group with all auctions (for multi-lot)
 */
export async function getAuctionGroup(groupId: string) {
  const { data, error } = await supabaseAdmin
    .from('auctions')
    .select(
      `
      *,
      auctions_sellers(*),
      supplies(*, supplies_sellers(*))
    `
    )
    .eq('auctions_group_settings_id', groupId)
    .order('lot_number', { ascending: true })

  if (error) {
    throw new Error(`Failed to fetch auction group: ${error.message}`)
  }

  return data
}

/**
 * Delete auction and its group (cascades to related data)
 */
export async function deleteAuction(auctionId: string) {
  // Get group ID first
  const { data: auction } = await supabaseAdmin
    .from('auctions')
    .select('auctions_group_settings_id')
    .eq('id', auctionId)
    .single()

  if (!auction) {
    console.warn(`Auction ${auctionId} not found, skipping cleanup`)
    return
  }

  // Delete the group (cascades to auctions, sellers, supplies)
  const { error } = await supabaseAdmin
    .from('auctions_group_settings')
    .delete()
    .eq('id', auction.auctions_group_settings_id)

  if (error) {
    console.error(`Failed to delete auction group: ${error.message}`)
  }
}

/**
 * Verify auction was created correctly with expected data
 */
export async function verifyAuctionCreated(auctionId: string, expected: AuctionVerificationData) {
  const auction = await getAuction(auctionId)

  // Verify basic fields
  expect(auction.type).toBe(expected.type)
  expect(auction.name).toBe(expected.name)
  expect(auction.baseline).toBe(expected.baseline)

  // Verify sellers
  expect(auction.auctions_sellers).toHaveLength(expected.supplierCount)

  // Verify supplies (line items)
  expect(auction.supplies).toHaveLength(expected.itemCount)

  return auction
}

/**
 * Verify Dutch auction has prebids scheduled with Cloud Tasks
 */
export async function verifyDutchPrebidsScheduled(auctionId: string) {
  const { data: bids, error } = await supabaseAdmin
    .from('bids')
    .select('cloud_task, seller_email, price')
    .eq('auction_id', auctionId)
    .not('cloud_task', 'is', null)

  if (error) {
    throw new Error(`Failed to fetch Dutch prebids: ${error.message}`)
  }

  // Verify at least one prebid exists
  expect(bids.length).toBeGreaterThan(0)

  // Verify Cloud Task reference format
  const cloudTaskPattern =
    /^projects\/crown-476614\/locations\/europe-west1\/queues\/BidWatchQueue\/tasks\/.+$/

  for (const bid of bids) {
    expect(bid.cloud_task).toMatch(cloudTaskPattern)
  }

  return bids
}

/**
 * Verify multi-lot timing (serial, parallel, staggered)
 */
export async function verifyMultiLotTiming(
  groupId: string,
  timingRule: 'serial' | 'parallel' | 'staggered'
) {
  const auctions = await getAuctionGroup(groupId)

  if (auctions.length < 2) {
    throw new Error('Multi-lot verification requires at least 2 lots')
  }

  const lot1Start = new Date(auctions[0].start_at)
  const lot2Start = new Date(auctions[1].start_at)

  switch (timingRule) {
    case 'serial': {
      // Lot 2 should start after Lot 1 ends
      const lot1Duration = auctions[0].duration
      const expectedDiff = lot1Duration * 60 * 1000 // Convert minutes to ms

      const actualDiff = lot2Start.getTime() - lot1Start.getTime()
      expect(actualDiff).toBe(expectedDiff)
      break
    }

    case 'parallel': {
      // Both lots should start at the same time
      expect(lot2Start.getTime()).toBe(lot1Start.getTime())
      break
    }

    case 'staggered': {
      // Lot 2 should start at a fixed interval after Lot 1
      // (implementation varies, just verify they're different)
      expect(lot2Start.getTime()).not.toBe(lot1Start.getTime())
      break
    }
  }

  return auctions
}

/**
 * Get auction ID from URL
 */
export function extractAuctionIdFromUrl(url: string): string | null {
  const match = url.match(/lots\/([a-f0-9-]+)\//)
  return match ? match[1] : null
}

/**
 * Get group ID from URL
 */
export function extractGroupIdFromUrl(url: string): string | null {
  const match = url.match(/auctions\/([a-f0-9-]+)\//)
  return match ? match[1] : null
}

/**
 * Verify flat duplication succeeded
 * Finds the duplicated auction by name and verifies it matches the original
 */
export async function verifyFlatDuplication(originalId: string, duplicatedName: string) {
  console.log(`[verifyFlatDuplication] Searching for: "${duplicatedName}"`)

  // First, let's see ALL recent auctions to understand what's in the database
  const { data: allRecent } = await supabaseAdmin
    .from('auctions')
    .select('id, lot_name, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  console.log(`[verifyFlatDuplication] Recent auctions in database:`)
  allRecent?.forEach((a, i) => {
    console.log(`  ${i + 1}. "${a.lot_name}" (id: ${a.id})`)
  })

  // Find the duplicated auction by name
  const { data: allMatches, error: searchError } = await supabaseAdmin
    .from('auctions')
    .select('*, auctions_sellers(*), supplies(*)')
    .eq('lot_name', duplicatedName)

  if (searchError) {
    throw new Error(`Failed to search for duplicated auction: ${searchError.message}`)
  }

  console.log(
    `[verifyFlatDuplication] Found ${allMatches?.length || 0} matches for "${duplicatedName}"`
  )
  if (allMatches && allMatches.length > 0) {
    allMatches.forEach((a, i) => {
      console.log(`  Match ${i + 1}: lot_name="${a.lot_name}", id=${a.id}`)
    })
  }

  if (!allMatches || allMatches.length === 0) {
    throw new Error(`No duplicated auction found with name: ${duplicatedName}`)
  }

  if (allMatches.length > 1) {
    throw new Error(
      `Found ${allMatches.length} auctions with name "${duplicatedName}" - expected only 1`
    )
  }

  const duplicated = allMatches[0]

  expect(duplicated).toBeTruthy()
  expect(duplicated.published).toBe(false)

  // Verify it's a proper copy
  const original = await getAuction(originalId)
  expect(duplicated.type).toBe(original.type)
  expect(duplicated.baseline).toBe(original.baseline)
  expect(duplicated.auctions_sellers.length).toBe(original.auctions_sellers.length)
  expect(duplicated.supplies.length).toBe(original.supplies.length)

  return duplicated
}

/**
 * Verify training duplication created one auction per supplier
 */
export async function verifyTrainingDuplication(originalId: string, expectedSupplierCount: number) {
  const original = await getAuction(originalId)
  const originalName = original.lot_name

  console.log(`[verifyTrainingDuplication] Searching for training auctions...`)
  console.log(`  Original auction ID: ${originalId}`)
  console.log(`  Original lot_name: "${originalName}"`)
  console.log(`  Expected supplier count: ${expectedSupplierCount}`)

  // First, let's see ALL recent auctions to understand what's in the database
  const { data: allRecent } = await supabaseAdmin
    .from('auctions')
    .select('id, lot_name, usage, created_at')
    .order('created_at', { ascending: false })
    .limit(20)

  console.log(`  Recent auctions in database:`)
  allRecent?.forEach((a, i) => {
    console.log(`    ${i + 1}. "${a.lot_name}" (usage: ${a.usage}, id: ${a.id})`)
  })

  // Add retry logic in case of timing issues with DB commits
  let trainingAuctions: any[] | null = null
  let error: any = null
  let attempts = 0
  const maxAttempts = 5

  while (attempts < maxAttempts) {
    attempts++
    console.log(`  Attempt ${attempts}/${maxAttempts}...`)

    const result = await supabaseAdmin
      .from('auctions')
      .select('*, auctions_sellers(*)')
      .like('lot_name', `%${originalName}%Training%`)

    error = result.error
    trainingAuctions = result.data

    console.log(`    Found ${trainingAuctions?.length || 0} auctions`)

    if (trainingAuctions && trainingAuctions.length === expectedSupplierCount) {
      console.log(`  ✓ Found expected number of training auctions`)
      break
    }

    if (attempts < maxAttempts) {
      console.log(`    Waiting 500ms before retry...`)
      await new Promise((resolve) => setTimeout(resolve, 500))
    }
  }

  if (error) {
    throw new Error(`Failed to find training auctions: ${error.message}`)
  }

  if (trainingAuctions) {
    console.log(`  Final result: Found ${trainingAuctions.length} training auctions:`)
    trainingAuctions.forEach((a) => {
      console.log(`    - "${a.lot_name}" (usage: ${a.usage})`)
    })
  }

  // Should have one auction per supplier
  expect(trainingAuctions?.length || 0).toBe(expectedSupplierCount)

  if (!trainingAuctions || trainingAuctions.length === 0) {
    throw new Error('No training auctions found')
  }

  // Verify each auction has usage='training'
  for (const auction of trainingAuctions) {
    expect(auction.usage).toBe('training')
    expect(auction.published).toBe(false)

    // Verify name pattern: "[name] - Training [email]"
    expect(auction.lot_name).toMatch(new RegExp(`${originalName}.*Training.*@`))
  }

  return trainingAuctions
}

/**
 * Delete auction group by ID (cascades to all auctions in the group)
 */
export async function deleteAuctionGroup(groupId: string) {
  const { error } = await supabaseAdmin.from('auctions_group_settings').delete().eq('id', groupId)

  if (error) {
    console.error(`Failed to delete auction group ${groupId}:`, error.message)
  }
}

/**
 * Get all group IDs for auctions matching a name pattern
 * Useful for cleanup after training duplication (multiple groups created)
 */
export async function getGroupIdsForAuctions(namePattern: string) {
  const { data } = await supabaseAdmin
    .from('auctions')
    .select('auctions_group_settings_id')
    .like('lot_name', namePattern)

  if (!data) return []

  // Return unique group IDs
  return [...new Set(data.map((a) => a.auctions_group_settings_id))]
}
