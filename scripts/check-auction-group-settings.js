#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const groupId = process.argv[2]

if (!groupId) {
  console.error('Usage: node check-auction-group-settings.js <group-id>')
  process.exit(1)
}

async function checkGroup() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

  console.log(`\n🔍 Vérification du groupe ${groupId}...\n`)

  const { data, error } = await supabase
    .from('auctions_group_settings')
    .select('*')
    .eq('id', groupId)

  if (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.log('❌ Groupe non trouvé\n')
    process.exit(1)
  }

  console.log('✅ Groupe trouvé:\n')
  console.log(JSON.stringify(data[0], null, 2))
}

checkGroup().catch(console.error)
