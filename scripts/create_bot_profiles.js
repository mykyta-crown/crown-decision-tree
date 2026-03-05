#!/usr/bin/env node

/**
 * Create Bot Profiles for Training Auctions
 *
 * This script creates 5 bot user accounts that are used in training/test auctions.
 *
 * Usage: node scripts/create_bot_profiles.js
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_ADMIN_KEY = process.env.SUPABASE_ADMIN_KEY

if (!SUPABASE_ADMIN_KEY) {
  console.error('❌ Missing SUPABASE_ADMIN_KEY in .env file')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ADMIN_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

const BOT_EMAILS = [
  'bot-1@crown-procurement.com',
  'bot-2@crown-procurement.com',
  'bot-3@crown-procurement.com',
  'bot-4@crown-procurement.com',
  'bot-5@crown-procurement.com'
]

async function createBots() {
  console.log('🤖 Creating bot profiles for training auctions...\n')

  for (let i = 0; i < BOT_EMAILS.length; i++) {
    const email = BOT_EMAILS[i]
    const botNumber = i + 1

    console.log(`Creating Bot ${botNumber}: ${email}`)

    // Check if bot already exists
    const { data: existingUser } = await supabase.auth.admin.listUsers()
    const userExists = existingUser.users.find((u) => u.email === email)

    if (userExists) {
      console.log(`  ⚠️  User already exists (ID: ${userExists.id})`)

      // Check if profile exists
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userExists.id)
        .single()

      if (profile) {
        console.log(`  ✅ Profile exists (role: ${profile.role || 'not set'})`)

        // Update role if needed
        if (profile.role !== 'supplier') {
          const { error: updateError } = await supabase
            .from('profiles')
            .update({ role: 'supplier' })
            .eq('id', userExists.id)

          if (!updateError) {
            console.log(`  ✅ Updated role to supplier`)
          }
        }
      } else {
        console.log(`  ⚠️  Profile missing, creating...`)

        // Create profile manually
        const { error: insertError } = await supabase.from('profiles').insert({
          id: userExists.id,
          email: email,
          first_name: 'Bot',
          last_name: `${botNumber}`,
          role: 'supplier'
        })

        if (insertError) {
          console.error(`  ❌ Profile creation error: ${insertError.message}`)
        } else {
          console.log(`  ✅ Profile created`)
        }
      }

      console.log('')
      continue
    }

    // Create bot user in auth.users
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: email,
      password: 'BotPassword123!',
      email_confirm: true,
      user_metadata: {
        first_name: 'Bot',
        last_name: `${botNumber}`
      }
    })

    if (authError) {
      console.error(`  ❌ Auth error: ${authError.message}\n`)
      continue
    }

    console.log(`  ✅ Auth user created (ID: ${authData.user.id})`)

    // Wait for webhook to process
    console.log(`  ⏳ Waiting for webhook to create profile...`)
    await new Promise((resolve) => setTimeout(resolve, 3000))

    // Check if profile was created by webhook
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    if (profile) {
      console.log(`  ✅ Profile created automatically via webhook`)

      // Update profile with bot details
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          first_name: 'Bot',
          last_name: `${botNumber}`,
          role: 'supplier'
        })
        .eq('id', authData.user.id)

      if (!updateError) {
        console.log(`  ✅ Profile updated with role=supplier`)
      }
    } else {
      console.log(`  ⚠️  Webhook didn't create profile, creating manually...`)

      // Create profile manually
      const { error: insertError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: email,
        first_name: 'Bot',
        last_name: `${botNumber}`,
        role: 'supplier'
      })

      if (insertError) {
        console.error(`  ❌ Profile creation error: ${insertError.message}`)
      } else {
        console.log(`  ✅ Profile created manually`)
      }
    }

    console.log('')
  }

  // Verify all bots
  console.log('═══════════════════════════════════════════════════')
  console.log('📊 Verification:\n')

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .in('email', BOT_EMAILS)
    .order('email')

  if (profiles && profiles.length > 0) {
    console.log('✅ Bot profiles in database:\n')
    profiles.forEach((p) => {
      console.log(`   ${p.email}`)
      console.log(`   ├─ Name: ${p.first_name} ${p.last_name}`)
      console.log(`   ├─ Role: ${p.role || 'not set'}`)
      console.log(`   └─ ID: ${p.id}\n`)
    })
    console.log(`Total: ${profiles.length}/5 bots created successfully`)
  } else {
    console.log('❌ No bot profiles found in database')
  }

  console.log('═══════════════════════════════════════════════════')
  console.log('\n✅ Bot creation complete!')
  console.log('\n📝 Next steps:')
  console.log('   1. Go to auction builder')
  console.log('   2. Set usage to "training" or "test"')
  console.log('   3. Invite bot emails as suppliers')
  console.log('   4. Set ceiling prices for each bot')
  console.log('   5. Publish and test!\n')
}

createBots().catch((error) => {
  console.error('❌ Script failed:', error.message)
  process.exit(1)
})
