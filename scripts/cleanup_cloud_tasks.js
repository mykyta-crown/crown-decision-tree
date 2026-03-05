#!/usr/bin/env node

/**
 * Nettoie les Cloud Tasks orphelines et doublons
 * Usage: node scripts/cleanup_cloud_tasks.js --prod --dry-run
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv, validateEnv } from './lib/env-loader.js'

// Load environment variables (supports --prod flag)
loadEnv()
validateEnv(['SUPABASE_URL', 'SUPABASE_ADMIN_KEY'])

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

const DRY_RUN = process.argv.includes('--dry-run')

async function cleanupPastAuctionTasks() {
  console.log('\n🧹 NETTOYAGE DES CLOUD TASKS SUR ENCHÈRES PASSÉES\n')

  // Trouver les prebids avec cloud_task sur enchères terminées
  const { data: orphanBids, error } = await supabase
    .from('bids')
    .select(
      `
      id,
      price,
      cloud_task,
      auction:auctions(id, name, type, end_at, status)
    `
    )
    .eq('type', 'prebid')
    .not('cloud_task', 'is', null)

  if (error) {
    console.error('❌ Erreur:', error.message)
    return { cleaned: 0, errors: 0 }
  }

  // Filtrer ceux dont l'enchère est terminée
  const now = new Date()
  const bidsToClean = orphanBids.filter((bid) => {
    return bid.auction && new Date(bid.auction.end_at) < now
  })

  if (bidsToClean.length === 0) {
    console.log('✅ Aucune Cloud Task orpheline sur enchères passées\n')
    return { cleaned: 0, errors: 0 }
  }

  console.log(`📋 ${bidsToClean.length} Cloud Task(s) orpheline(s) détectée(s):\n`)

  // Grouper par enchère pour l'affichage
  const byAuction = {}
  bidsToClean.forEach((bid) => {
    const auctionName = bid.auction?.name || 'Unknown'
    if (!byAuction[auctionName]) {
      byAuction[auctionName] = []
    }
    byAuction[auctionName].push(bid)
  })

  // Afficher résumé
  Object.entries(byAuction).forEach(([name, bids]) => {
    const endDate = new Date(bids[0].auction.end_at).toLocaleString('fr-FR')
    console.log(`  • ${name} (terminée le ${endDate})`)
    console.log(`    → ${bids.length} Cloud Task(s) à nettoyer`)
  })

  if (DRY_RUN) {
    console.log('\n⚠️  MODE DRY-RUN: Aucune modification effectuée')
    console.log('   Relancez sans --dry-run pour effectuer le nettoyage\n')
    return { cleaned: 0, errors: 0 }
  }

  console.log('\n🔧 Nettoyage en cours...\n')

  let cleaned = 0
  let errors = 0

  // Nettoyer par lots de 100
  for (let i = 0; i < bidsToClean.length; i += 100) {
    const batch = bidsToClean.slice(i, i + 100)
    const ids = batch.map((b) => b.id)

    const { error } = await supabase.from('bids').update({ cloud_task: null }).in('id', ids)

    if (error) {
      console.error(`  ❌ Erreur batch ${i / 100 + 1}:`, error.message)
      errors += batch.length
    } else {
      cleaned += batch.length
      console.log(`  ✅ Batch ${Math.floor(i / 100) + 1}: ${batch.length} prebid(s) nettoyé(s)`)
    }
  }

  console.log(`\n✅ Nettoyage terminé: ${cleaned} Cloud Task(s) supprimée(s)\n`)
  return { cleaned, errors }
}

async function cleanupDuplicateBids() {
  console.log('\n🧹 NETTOYAGE DES PREBIDS DUPLIQUÉS\n')

  // Trouver tous les prebids avec cloud_task
  const { data: allBids, error } = await supabase
    .from('bids')
    .select('id, auction_id, seller_email, price, cloud_task, created_at')
    .eq('type', 'prebid')
    .not('cloud_task', 'is', null)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('❌ Erreur:', error.message)
    return { cleaned: 0, errors: 0 }
  }

  // Grouper par (auction_id, seller_email, price)
  const grouped = {}
  allBids.forEach((bid) => {
    const key = `${bid.auction_id}_${bid.seller_email}_${bid.price}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(bid)
  })

  // Trouver les doublons (plus de 1 bid par groupe)
  const duplicates = Object.entries(grouped).filter(([_, bids]) => bids.length > 1)

  if (duplicates.length === 0) {
    console.log('✅ Aucun doublon détecté\n')
    return { cleaned: 0, errors: 0 }
  }

  console.log(`📋 ${duplicates.length} groupe(s) de doublons détecté(s):\n`)

  let totalDuplicates = 0
  duplicates.forEach(([key, bids]) => {
    totalDuplicates += bids.length - 1 // Garder le premier
    const [auction_id, seller, price] = key.split('_')
    console.log(`  • Auction ${auction_id.substring(0, 8)}... | Seller: ${seller} | Prix: ${price}`)
    console.log(`    → ${bids.length} prebids identiques (${bids.length - 1} à supprimer)`)
  })

  console.log(`\n  Total: ${totalDuplicates} prebid(s) en double à nettoyer\n`)

  if (DRY_RUN) {
    console.log('⚠️  MODE DRY-RUN: Aucune modification effectuée')
    console.log('   Relancez sans --dry-run pour effectuer le nettoyage\n')
    return { cleaned: 0, errors: 0 }
  }

  console.log('🔧 Nettoyage en cours...\n')

  let cleaned = 0
  let errors = 0

  // Pour chaque groupe de doublons, garder le plus ancien et supprimer les autres
  for (const [key, bids] of duplicates) {
    // Garder le premier (plus ancien), supprimer les autres
    const toDelete = bids.slice(1)

    for (const bid of toDelete) {
      const { error } = await supabase.from('bids').delete().eq('id', bid.id)

      if (error) {
        console.error(`  ❌ Erreur suppression ${bid.id.substring(0, 8)}...:`, error.message)
        errors++
      } else {
        cleaned++
      }
    }
  }

  console.log(`\n✅ Nettoyage terminé: ${cleaned} doublon(s) supprimé(s)\n`)
  return { cleaned, errors }
}

async function main() {
  console.log('🚀 NETTOYAGE DES CLOUD TASKS')
  console.log('================================================')

  if (DRY_RUN) {
    console.log('⚠️  MODE DRY-RUN ACTIVÉ - Aucune modification ne sera effectuée\n')
  }

  // 1. Nettoyer les Cloud Tasks sur enchères passées
  const pastResults = await cleanupPastAuctionTasks()

  // 2. Nettoyer les doublons
  const dupeResults = await cleanupDuplicateBids()

  // Résumé final
  console.log('================================================')
  console.log('📊 RÉSUMÉ FINAL\n')
  console.log('Cloud Tasks orphelines:')
  console.log(`  ✅ Nettoyées: ${pastResults.cleaned}`)
  console.log(`  ❌ Erreurs: ${pastResults.errors}`)
  console.log('')
  console.log('Doublons:')
  console.log(`  ✅ Supprimés: ${dupeResults.cleaned}`)
  console.log(`  ❌ Erreurs: ${dupeResults.errors}`)
  console.log('')
  console.log(`Total nettoyé: ${pastResults.cleaned + dupeResults.cleaned}`)

  if (DRY_RUN) {
    console.log('\n💡 Pour effectuer le nettoyage, relancez sans --dry-run')
  }
}

main().catch(console.error)
