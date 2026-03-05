/**
 * Test script for webhook system - Creates a test prebid to verify webhook delivery
 *
 * This script:
 * 1. Creates a test Dutch auction if needed
 * 2. Creates a test prebid
 * 3. Verifies the webhook was called and Cloud Task was created
 *
 * Usage:
 *   node scripts/test_webhook_insert_bid.js
 *
 * Environment variables required:
 *   SUPABASE_URL
 *   SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)
 */

import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'

// Load environment variables
config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_ADMIN_KEY ||
  process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing environment variables:')
  console.error('   SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error(
    '   SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ADMIN_KEY or SUPABASE_ANON_KEY:',
    supabaseKey ? '✓' : '✗'
  )
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function main() {
  console.log('🧪 Webhook Test Script - Insert Bid')
  console.log('=====================================\n')

  try {
    // Step 1: Find or create a test Dutch auction
    console.log('1️⃣ Finding test Dutch auction...')

    let { data: auction, error: fetchError } = await supabase
      .from('auctions')
      .select('id, name, type, start_at, end_at, test')
      .eq('type', 'dutch')
      .eq('test', true)
      .gte('end_at', new Date().toISOString())
      .limit(1)
      .single()

    if (fetchError || !auction) {
      console.log('   No suitable test auction found, creating one...')

      const startAt = new Date()
      startAt.setMinutes(startAt.getMinutes() + 10) // Start in 10 minutes

      const endAt = new Date(startAt)
      endAt.setHours(endAt.getHours() + 2) // Duration: 2 hours

      const { data: newAuction, error: createError } = await supabase
        .from('auctions')
        .insert({
          name: 'Test Webhook - Dutch Auction',
          description: 'Created by test_webhook_insert_bid.js',
          type: 'dutch',
          test: true,
          start_at: startAt.toISOString(),
          end_at: endAt.toISOString(),
          duration: 120, // 2 hours in minutes
          baseline: 1000, // Starting price
          max_bid_decr: 100, // Ending/reserve price
          min_bid_decr: 50, // Price decrement per round
          overtime_range: 5, // 5 minutes per round
          dutch_prebid_enabled: true, // Enable prebids
          status: 'pending',
          currency: 'EUR',
          timezone: 'Europe/Paris'
        })
        .select()
        .single()

      if (createError) {
        throw new Error(`Failed to create test auction: ${createError.message}`)
      }

      auction = newAuction
      console.log('   ✅ Created test auction:', auction.id)
    } else {
      console.log('   ✅ Found test auction:', auction.id)
    }

    // Step 2: Create a test user (triggers insert_users webhook → profile creation)
    console.log('\n2️⃣ Creating test user...')

    const testEmail = `test-seller-${Date.now()}@crown-webhook-test.com`
    const testPassword = 'TestPassword123!'

    // Create user via Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Auto-confirm email for testing
    })

    if (authError) {
      throw new Error(`Failed to create test user: ${authError.message}`)
    }

    console.log('   ✅ Created test user:', testEmail)
    console.log('   ⏳ Waiting for insert_users webhook to create profile...')

    // Wait for the insert_users webhook to create the profile
    await new Promise((resolve) => setTimeout(resolve, 2000))

    // Check if profile was created by webhook
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, email')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      console.log('   ⚠️  Profile not created by webhook, creating manually...')

      // Create profile manually (fallback if webhook not configured)
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: testEmail
        })
        .select()
        .single()

      if (createProfileError) {
        throw new Error(`Failed to create profile: ${createProfileError.message}`)
      }

      profile = newProfile
      console.log('   ✅ Profile created manually:', profile.email)
    } else {
      console.log('   ✅ Profile created via webhook:', profile.email)
    }

    const seller = profile

    // Step 2b: Add seller to auction (required for prebid scheduling)
    console.log('\n2b️⃣ Adding seller to auction...')

    const { error: auctionSellerError } = await supabase.from('auctions_sellers').insert({
      auction_id: auction.id,
      seller_email: seller.email
    })

    if (auctionSellerError) {
      // Ignore duplicate error (seller already added)
      if (!auctionSellerError.message.includes('duplicate')) {
        throw new Error(`Failed to add seller to auction: ${auctionSellerError.message}`)
      }
      console.log('   ⚠️  Seller already added to auction')
    } else {
      console.log('   ✅ Seller added to auction')
    }

    // Step 3: Create a test prebid
    console.log('\n3️⃣ Creating test prebid...')

    const triggerPrice = 800 // Will trigger when price reaches 800

    const { data: bid, error: bidError } = await supabase
      .from('bids')
      .insert({
        auction_id: auction.id,
        seller_id: seller.id, // FK to profiles (for JOIN)
        seller_email: seller.email, // Denormalized
        type: 'prebid',
        price: triggerPrice,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (bidError) {
      throw new Error(`Failed to create prebid: ${bidError.message}`)
    }

    console.log('   ✅ Created prebid:', bid.id)
    console.log('      Trigger price:', triggerPrice)

    // Step 4: Wait a moment for webhook to process
    console.log('\n4️⃣ Waiting for insert_bid webhook processing...')
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Step 5: Check if Cloud Task was created
    console.log('\n5️⃣ Verifying Cloud Task creation...')

    const { data: updatedBid, error: checkError } = await supabase
      .from('bids')
      .select('id, cloud_task, created_at')
      .eq('id', bid.id)
      .single()

    if (checkError) {
      throw new Error(`Failed to check bid: ${checkError.message}`)
    }

    if (updatedBid.cloud_task) {
      console.log('   ✅ SUCCESS! Cloud Task was created')
      console.log('      Task reference:', updatedBid.cloud_task)
      console.log('\n✅ Webhook system is working correctly!')
    } else {
      console.log('   ❌ FAILED! No Cloud Task was created')
      console.log('      This indicates the webhook did not reach the API')
      console.log('\n⚠️  Webhook Troubleshooting:')
      console.log('   1. Check Supabase Dashboard → Database → Database Webhooks')
      console.log('   2. Verify insert_bid webhook is enabled')
      console.log('   3. Check webhook URL points to correct domain')
      console.log('   4. Verify payload is: {"record": {{ record }}}')
      console.log('   5. Check Authorization header has correct Bearer token')
      console.log('   6. Check Vercel logs: vercel logs --follow')
      console.log('   7. Check Supabase logs: Dashboard → Logs → Postgres Logs')
    }

    console.log('\n📊 Test Summary:')
    console.log('   Auction ID:', auction.id)
    console.log('   Bid ID:', bid.id)
    console.log('   Cloud Task:', updatedBid.cloud_task || 'NOT CREATED')
    console.log('   Status:', updatedBid.cloud_task ? '✅ PASS' : '❌ FAIL')
  } catch (error) {
    console.error('\n❌ Test failed with error:')
    console.error(error.message)
    console.error('\nStack trace:')
    console.error(error.stack)
    process.exit(1)
  }
}

main()
