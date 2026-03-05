#!/usr/bin/env node

/**
 * Configure Webhook Settings Script
 *
 * This script reads WEBHOOK_BASE_URL and WEBHOOK_BEARER_TOKEN from .env
 * and updates the public.webhook_config table in Supabase.
 *
 * Usage:
 *   node scripts/run.js configureWebhooks.js
 *   node scripts/run.js configureWebhooks.js --production
 */

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'

// Get environment
const isProduction = process.argv.includes('--production') || process.argv.includes('--prod')
const envName = isProduction ? 'PRODUCTION' : 'LOCAL'

console.log(`\n🔧 Configuring webhooks for ${envName} environment\n`)

// Get Supabase credentials
const SUPABASE_URL = process.env.SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_ADMIN_KEY || process.env.SUPABASE_SERVICE_KEY

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_ADMIN_KEY/SUPABASE_SERVICE_KEY')
  process.exit(1)
}

// Get webhook configuration
const WEBHOOK_BASE_URL = process.env.WEBHOOK_BASE_URL
const WEBHOOK_BEARER_TOKEN = process.env.WEBHOOK_BEARER_TOKEN

if (!WEBHOOK_BASE_URL || !WEBHOOK_BEARER_TOKEN) {
  console.error('❌ Missing WEBHOOK_BASE_URL or WEBHOOK_BEARER_TOKEN in .env')
  console.error('\nPlease add these to your .env file:')
  console.error('  WEBHOOK_BASE_URL=https://your-domain.com')
  console.error('  WEBHOOK_BEARER_TOKEN=your-token-here')
  process.exit(1)
}

console.log(`📍 Base URL: ${WEBHOOK_BASE_URL}`)
console.log(`🔑 Token: ${WEBHOOK_BEARER_TOKEN.substring(0, 20)}...`)

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false }
})

try {
  // Update base_url
  const { error: urlError } = await supabase
    .from('webhook_config')
    .update({ value: WEBHOOK_BASE_URL, updated_at: new Date().toISOString() })
    .eq('key', 'base_url')

  if (urlError) {
    throw new Error(`Failed to update base_url: ${urlError.message}`)
  }

  console.log('✅ Updated base_url')

  // Update bearer_token
  const { error: tokenError } = await supabase
    .from('webhook_config')
    .update({ value: WEBHOOK_BEARER_TOKEN, updated_at: new Date().toISOString() })
    .eq('key', 'bearer_token')

  if (tokenError) {
    throw new Error(`Failed to update bearer_token: ${tokenError.message}`)
  }

  console.log('✅ Updated bearer_token')

  // Verify configuration
  const { data: config, error: readError } = await supabase
    .from('webhook_config')
    .select('*')
    .order('key')

  if (readError) {
    throw new Error(`Failed to read config: ${readError.message}`)
  }

  console.log('\n📋 Current webhook configuration:')
  for (const row of config) {
    const displayValue = row.key === 'bearer_token' ? row.value.substring(0, 20) + '...' : row.value
    console.log(`  ${row.key}: ${displayValue}`)
  }

  console.log('\n✅ Webhook configuration completed successfully!')
  console.log('\n🧪 Test by creating a prebid and checking if cloud_task is set.')
} catch (error) {
  console.error(`\n❌ Error: ${error.message}`)
  process.exit(1)
}
