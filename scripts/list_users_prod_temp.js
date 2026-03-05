#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.production' })

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function listUsers() {
  console.log('🌍 Environment: PRODUCTION\n')
  console.log('🔍 Searching for users with "louis" in email or name...\n')

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, email, first_name, last_name, role')
    .or('email.ilike.%louis%,first_name.ilike.%louis%,last_name.ilike.%louis%')
    .order('email')

  if (error) {
    console.error('❌ Error:', error.message)
    return
  }

  if (!profiles || profiles.length === 0) {
    console.log('❌ No users found with "louis"')
    return
  }

  console.log(`✅ Found ${profiles.length} user(s):\n`)
  profiles.forEach((p, i) => {
    console.log(`${i + 1}. ${p.email}`)
    console.log(`   Name: ${p.first_name} ${p.last_name}`)
    console.log(`   Role: ${p.role}`)
    console.log(`   ID: ${p.id}\n`)
  })
}

listUsers().catch(console.error)
