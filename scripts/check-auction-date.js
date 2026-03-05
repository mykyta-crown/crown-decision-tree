#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const auctionId = process.argv[2]

if (!auctionId) {
  console.error('Usage: node check-auction-date.js <auction-id>')
  process.exit(1)
}

async function checkAuction() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

  console.log(`\n🔍 Vérification de l'enchère ${auctionId}...\n`)

  const { data, error } = await supabase
    .from('auctions')
    .select('id, name, start_at, end_at, status')
    .eq('id', auctionId)

  if (error) {
    console.error('❌ Erreur:', error.message)
    process.exit(1)
  }

  if (!data || data.length === 0) {
    console.error('❌ Enchère non trouvée')
    process.exit(1)
  }

  const auction = data[0]

  console.log('✅ Enchère trouvée:\n')
  console.log(`📋 ID: ${auction.id}`)
  console.log(`📝 Nom: ${auction.name || 'Sans nom'}`)
  console.log(`📅 Start date actuelle: ${auction.start_at}`)
  console.log(`📅 End date: ${auction.end_at}`)
  console.log(`🏷️  Status: ${auction.status}\n`)

  // Parse la date actuelle
  const currentDate = new Date(auction.start_at)
  console.log('Date parsée:')
  console.log(`  - Date: ${currentDate.toLocaleDateString('fr-FR')}`)
  console.log(
    `  - Heure actuelle: ${currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`
  )
}

checkAuction().catch(console.error)
