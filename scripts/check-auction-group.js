#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

const groupId = process.argv[2]

if (!groupId) {
  console.error('Usage: node check-auction-group.js <auction-group-id>')
  process.exit(1)
}

async function checkGroup() {
  const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

  console.log(`\n🔍 Vérification du groupe d'enchères ${groupId}...\n`)

  // Check auction_group
  const { data: group, error: groupError } = await supabase
    .from('auction_groups')
    .select('id, name')
    .eq('id', groupId)

  if (groupError) {
    console.error('❌ Erreur:', groupError.message)
    process.exit(1)
  }

  if (!group || group.length === 0) {
    console.error("❌ Groupe d'enchères non trouvé")
    process.exit(1)
  }

  console.log('✅ Groupe trouvé:\n')
  console.log(`📋 ID: ${group[0].id}`)
  console.log(`📝 Nom: ${group[0].name || 'Sans nom'}\n`)

  // Get all auctions in this group
  const { data: auctions, error: auctionsError } = await supabase
    .from('auctions')
    .select('id, name, start_at, end_at, status, type')
    .eq('auction_group_id', groupId)
    .order('start_at', { ascending: true })

  if (auctionsError) {
    console.error('❌ Erreur lors de la récupération des enchères:', auctionsError.message)
    process.exit(1)
  }

  if (!auctions || auctions.length === 0) {
    console.log('⚠️  Aucune enchère dans ce groupe\n')
    process.exit(0)
  }

  console.log(`📊 ${auctions.length} enchère(s) dans ce groupe:\n`)

  auctions.forEach((auction, index) => {
    const startDate = new Date(auction.start_at)
    const endDate = new Date(auction.end_at)

    console.log(`${index + 1}. ${auction.name || 'Sans nom'}`)
    console.log(`   Type: ${auction.type}`)
    console.log(`   Status: ${auction.status}`)
    console.log(
      `   Start: ${startDate.toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
      })} (${startDate.toISOString()})`
    )
    console.log(
      `   End: ${endDate.toLocaleString('fr-FR', {
        dateStyle: 'short',
        timeStyle: 'short'
      })}`
    )
    console.log('')
  })
}

checkGroup().catch(console.error)
