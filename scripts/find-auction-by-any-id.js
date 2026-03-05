#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const searchId = process.argv[2]

if (!searchId) {
  console.error('Usage: node find-auction-by-any-id.js <id>')
  process.exit(1)
}

async function findAuction() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

  console.log(`\n🔍 Recherche de ${searchId} dans la base...\n`)

  // Search in auctions table - try by ID first
  const { data: auctions, error } = await supabase
    .from('auctions')
    .select('*')
    .eq('id', searchId)
    .limit(20)

  if (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }

  if (!auctions || auctions.length === 0) {
    console.log('❌ Aucune enchère trouvée avec cet ID\n')
    process.exit(1)
  }

  console.log(`✅ ${auctions.length} enchère(s) trouvée(s):\n`)

  auctions.forEach((auction, index) => {
    console.log(`━━━ Enchère ${index + 1} ━━━`)
    console.log(`ID: ${auction.id}`)
    console.log(`Nom: ${auction.name || 'Sans nom'}`)
    console.log(`Type: ${auction.type}`)
    console.log(`Status: ${auction.status}`)
    console.log(`Multi-lot: ${auction.multi_lot ? 'Oui' : 'Non'}`)

    if (auction.start_at) {
      const startDate = new Date(auction.start_at)
      console.log(`Start: ${startDate.toLocaleString('fr-FR')} (${auction.start_at})`)
    }

    if (auction.end_at) {
      const endDate = new Date(auction.end_at)
      console.log(`End: ${endDate.toLocaleString('fr-FR')} (${auction.end_at})`)
    }

    // Show all keys to understand structure
    console.log('\n📋 Toutes les colonnes:')
    Object.keys(auction).forEach((key) => {
      if (!['id', 'name', 'type', 'status', 'start_at', 'end_at', 'multi_lot'].includes(key)) {
        console.log(`  ${key}: ${auction[key]}`)
      }
    })

    console.log('')
  })
}

findAuction().catch(console.error)
