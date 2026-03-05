/**
 * E2E Test Seeders
 *
 * Reusable functions to seed test data directly into the database.
 * This approach is faster and more reliable than using the UI (builder flow).
 *
 * Usage:
 *   const auctionId = await seedSimpleAuction(profile, { name: 'Test Auction' })
 */

import { supabaseAdmin } from './auction-helpers'

export interface SeedAuctionOptions {
  name: string
  description?: string
  type?: 'reverse' | 'dutch' | 'japanese' | 'sealed-bid'
  baseline?: number
  duration?: number
  published?: boolean
  usage?: 'real' | 'training' | 'test'
  supplierEmails?: string[]
  lotName?: string
  itemName?: string
  itemQuantity?: number
  itemUnit?: string
  ceilingPrice?: number
}

export interface UserProfile {
  id: string
  email: string
  company_id: string
}

/**
 * Seed a simple single-lot auction with one supplier
 * Returns the auction group ID and first auction ID
 */
export async function seedSimpleAuction(
  profile: UserProfile,
  options: SeedAuctionOptions
): Promise<{ groupId: string; auctionId: string }> {
  const {
    name,
    description = 'Test auction description',
    type = 'reverse',
    baseline = 10000,
    duration = 30,
    published = false,
    usage = 'test',
    supplierEmails = ['supplier1@test.com'],
    lotName = 'Test Lot',
    itemName = 'Test Item',
    itemQuantity = 10,
    itemUnit = 'pieces',
    ceilingPrice = 10000
  } = options

  // 1. Create auction group
  const { data: group, error: groupError } = await supabaseAdmin
    .from('auctions_group_settings')
    .insert({
      name,
      description,
      buyer_id: profile.id,
      timing_rule: 'serial'
    })
    .select()
    .single()

  if (groupError) throw new Error(`Failed to create group: ${groupError.message}`)

  const groupId = group!.id
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
  const endAt = new Date(startAt.getTime() + duration * 60 * 1000)

  // 2. Create auction
  const { data: auction, error: auctionError } = await supabaseAdmin
    .from('auctions')
    .insert({
      auctions_group_settings_id: groupId,
      lot_name: lotName,
      lot_number: 1,
      type,
      baseline,
      duration,
      start_at: startAt.toISOString(),
      end_at: endAt.toISOString(),
      published,
      usage,
      company_id: profile.company_id,
      buyer_id: profile.id,
      currency: 'EUR',
      timezone: 'Europe/Paris',
      min_bid_decr: 100,
      min_bid_decr_type: 'fixed',
      overtime_range: 5
    })
    .select()
    .single()

  if (auctionError) throw new Error(`Failed to create auction: ${auctionError.message}`)

  const auctionId = auction!.id

  // 3. Add suppliers to auction
  const sellersData = supplierEmails.map((email) => ({
    auction_id: auctionId,
    seller_email: email
  }))

  const { error: sellersError } = await supabaseAdmin.from('auctions_sellers').insert(sellersData)

  if (sellersError) throw new Error(`Failed to add sellers: ${sellersError.message}`)

  // 4. Create supply/item
  const { data: supply, error: supplyError } = await supabaseAdmin
    .from('supplies')
    .insert({
      auction_id: auctionId,
      name: itemName,
      quantity: itemQuantity,
      unit: itemUnit,
      index: 0
    })
    .select()
    .single()

  if (supplyError) throw new Error(`Failed to create supply: ${supplyError.message}`)

  // 5. Add ceiling prices for each supplier
  const suppliesSellersData = supplierEmails.map((email) => ({
    supply_id: supply!.id,
    seller_email: email,
    ceiling: ceilingPrice,
    additive: 0,
    multiplicative: 1
  }))

  const { error: suppliesSellersError } = await supabaseAdmin
    .from('supplies_sellers')
    .insert(suppliesSellersData)

  if (suppliesSellersError)
    throw new Error(`Failed to add supply sellers: ${suppliesSellersError.message}`)

  return { groupId, auctionId }
}

/**
 * Seed a multi-supplier auction (useful for testing training duplication)
 * Returns the auction group ID and first auction ID
 */
export async function seedMultiSupplierAuction(
  profile: UserProfile,
  options: SeedAuctionOptions & { supplierCount: number }
): Promise<{ groupId: string; auctionId: string }> {
  const { supplierCount, ...baseOptions } = options

  // Generate supplier emails
  const supplierEmails = Array.from(
    { length: supplierCount },
    (_, i) => `supplier${i + 1}@test.com`
  )

  return await seedSimpleAuction(profile, {
    ...baseOptions,
    supplierEmails
  })
}

/**
 * Seed a multi-lot auction
 * Returns the auction group ID and array of auction IDs
 */
export async function seedMultiLotAuction(
  profile: UserProfile,
  options: SeedAuctionOptions & { lotCount: number }
): Promise<{ groupId: string; auctionIds: string[] }> {
  const { lotCount, supplierEmails = ['supplier1@test.com'], ...baseOptions } = options

  // 1. Create auction group
  const { data: group, error: groupError } = await supabaseAdmin
    .from('auctions_group_settings')
    .insert({
      name: baseOptions.name,
      description: baseOptions.description || 'Test multi-lot auction',
      buyer_id: profile.id,
      timing_rule: 'serial'
    })
    .select()
    .single()

  if (groupError) throw new Error(`Failed to create group: ${groupError.message}`)

  const groupId = group!.id
  const startAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const duration = baseOptions.duration || 30

  // 2. Create multiple lots
  const auctionIds: string[] = []

  for (let i = 0; i < lotCount; i++) {
    const lotStart = new Date(startAt.getTime() + i * duration * 60 * 1000) // Serial timing
    const lotEnd = new Date(lotStart.getTime() + duration * 60 * 1000)

    const { data: auction, error: auctionError } = await supabaseAdmin
      .from('auctions')
      .insert({
        auctions_group_settings_id: groupId,
        lot_name: `${baseOptions.lotName || 'Lot'} ${i + 1}`,
        lot_number: i + 1,
        type: baseOptions.type || 'reverse',
        baseline: baseOptions.baseline || 10000,
        duration,
        start_at: lotStart.toISOString(),
        end_at: lotEnd.toISOString(),
        published: baseOptions.published || false,
        usage: baseOptions.usage || 'test',
        company_id: profile.company_id,
        buyer_id: profile.id,
        currency: 'EUR',
        timezone: 'Europe/Paris',
        min_bid_decr: 100,
        min_bid_decr_type: 'fixed',
        overtime_range: 5
      })
      .select()
      .single()

    if (auctionError) throw new Error(`Failed to create auction ${i + 1}: ${auctionError.message}`)

    const auctionId = auction!.id
    auctionIds.push(auctionId)

    // Add suppliers
    const sellersData = supplierEmails.map((email) => ({
      auction_id: auctionId,
      seller_email: email
    }))

    await supabaseAdmin.from('auctions_sellers').insert(sellersData)

    // Add one supply per lot
    const { data: supply } = await supabaseAdmin
      .from('supplies')
      .insert({
        auction_id: auctionId,
        name: `Item ${i + 1}`,
        quantity: 10,
        unit: 'pieces',
        index: 0
      })
      .select()
      .single()

    // Add ceiling prices
    const suppliesSellersData = supplierEmails.map((email) => ({
      supply_id: supply!.id,
      seller_email: email,
      ceiling: baseOptions.ceilingPrice || 10000,
      additive: 0,
      multiplicative: 1
    }))

    await supabaseAdmin.from('supplies_sellers').insert(suppliesSellersData)
  }

  return { groupId, auctionIds }
}

/**
 * Get user profile by email (needed for seeder functions)
 */
export async function getUserProfile(email: string): Promise<UserProfile> {
  const { data: profile, error } = await supabaseAdmin
    .from('profiles')
    .select('id, email, company_id')
    .eq('email', email)
    .single()

  if (error || !profile) {
    throw new Error(`Failed to get profile for ${email}: ${error?.message}`)
  }

  return profile as UserProfile
}

/**
 * Seed a Dutch auction with prebids enabled
 */
export async function seedDutchAuction(
  profile: UserProfile,
  options: SeedAuctionOptions
): Promise<{ groupId: string; auctionId: string }> {
  return await seedSimpleAuction(profile, {
    ...options,
    type: 'dutch'
  })
}

/**
 * Seed a Japanese auction
 */
export async function seedJapaneseAuction(
  profile: UserProfile,
  options: SeedAuctionOptions
): Promise<{ groupId: string; auctionId: string }> {
  return await seedSimpleAuction(profile, {
    ...options,
    type: 'japanese'
  })
}
