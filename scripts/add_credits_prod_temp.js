#!/usr/bin/env node

/**
 * Temporary script to add credits to production
 * Usage: node scripts/add_credits_prod_temp.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load production environment variables
dotenv.config({ path: '.env.production' })

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_ADMIN_KEY

if (!SUPABASE_ADMIN_KEY) {
  console.error('❌ SUPABASE_ADMIN_KEY not found in .env.production')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function addCredits() {
  console.log('🌍 Environment: PRODUCTION')
  console.log('📧 User: louis@crown.ovh')
  console.log('💰 Amount: 5000 credits\n')

  // 1. Find user
  console.log('🔍 Looking up user...')
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, email, role, first_name, last_name')
    .eq('email', 'louis@crown.ovh')

  if (profileError) {
    console.error('❌ Error:', profileError.message)
    return
  }

  if (!profiles || profiles.length === 0) {
    console.error('❌ User not found with email: louis@crown.ovh')
    return
  }

  if (profiles.length > 1) {
    console.log(`⚠️  Found ${profiles.length} profiles with this email. Using first one.`)
  }

  const profile = profiles[0]

  console.log('✅ User found:')
  console.log(`   ID: ${profile.id}`)
  console.log(`   Name: ${profile.first_name} ${profile.last_name}`)
  console.log(`   Role: ${profile.role}\n`)

  // 2. Get current balance
  console.log('📊 Fetching current balance...')
  const { data: currentCredits } = await supabase.rpc('get_user_credits', {
    p_user_id: profile.id
  })

  const current = currentCredits?.[0] || { credits_remaining: 0, credits_total: 0 }
  console.log(`   Current remaining: ${current.credits_remaining}`)
  console.log(`   Current total: ${current.credits_total}\n`)

  // 3. Add credits
  console.log('💳 Adding 5000 credits...')
  const { error: addError } = await supabase.rpc('add_user_credits', {
    p_user_id: profile.id,
    p_amount: 5000
  })

  if (addError) {
    console.error('❌ Error adding credits:', addError.message)
    return
  }

  // 4. Verify new balance
  console.log('✅ Credits added successfully!\n')
  const { data: newCredits } = await supabase.rpc('get_user_credits', {
    p_user_id: profile.id
  })

  const newBalance = newCredits?.[0] || { credits_remaining: 0, credits_total: 0 }
  console.log('📊 New balance:')
  console.log(`   Remaining: ${newBalance.credits_remaining} (+5000)`)
  console.log(`   Total: ${newBalance.credits_total} (+5000)`)

  console.log('\n🎉 Operation completed successfully!')
}

addCredits().catch((error) => {
  console.error('❌ Operation failed:', error.message)
  process.exit(1)
})
