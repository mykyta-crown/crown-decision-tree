/**
 * Analyse croisée Cloud Tasks vs Base de données
 * Usage: node scripts/analyze_cloud_tasks_prod.js --prod
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv, validateEnv } from './lib/env-loader.js'

// Load environment variables (supports --prod flag)
loadEnv()
validateEnv(['SUPABASE_URL', 'SUPABASE_ADMIN_KEY'])

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

async function main() {
  console.log('📊 ANALYSE CLOUD TASKS PROD\n')

  // 1. Prebids Dutch avec cloud_task (toutes enchères non terminées)
  console.log('=== 1. Enchères Dutch avec prebids (Cloud Tasks) ===\n')
  const { data: dutchAuctions } = await supabase
    .from('auctions')
    .select(
      `
      id,
      name,
      start_at,
      end_at,
      status,
      bids!inner(id, cloud_task, price)
    `
    )
    .eq('type', 'dutch')
    .eq('bids.type', 'prebid')
    .not('bids.cloud_task', 'is', null)
    .gt('end_at', new Date().toISOString())
    .eq('deleted', false)

  if (dutchAuctions?.length) {
    dutchAuctions.forEach((auction) => {
      const prebidsCount = auction.bids.length
      const now = new Date()
      const start = new Date(auction.start_at)
      const end = new Date(auction.end_at)
      const timing = start > now ? '⏰ À venir' : end > now ? '🔴 EN COURS' : '✅ Terminée'

      console.log(
        `  ${auction.name} (${start.toLocaleString('fr-FR')}) - ${auction.status} ${timing}`
      )
      console.log(`    → ${prebidsCount} prebid(s) avec Cloud Task`)
      auction.bids.forEach((bid) => {
        const taskId = bid.cloud_task.split('/').pop()
        console.log(`      • Bid price: ${bid.price} | Task: ${taskId}`)
      })
      console.log('')
    })
    console.log(`  Total: ${dutchAuctions.length} enchère(s) Dutch\n`)
  } else {
    console.log('  Aucune enchère Dutch avec prebids\n')
  }

  // 2. Enchères japonaises futures
  console.log('=== 2. Enchères Japanese futures ===\n')
  const { data: japaneseAuctions } = await supabase
    .from('auctions')
    .select('id, name, start_at, end_at, status, duration, overtime_range')
    .eq('type', 'japanese')
    .gt('start_at', new Date().toISOString())
    .eq('deleted', false)
    .order('start_at', { ascending: true })

  if (japaneseAuctions?.length) {
    japaneseAuctions.forEach((auction) => {
      const rounds = Math.ceil(auction.duration / auction.overtime_range)
      console.log(
        `  ${auction.name} (${new Date(auction.start_at).toLocaleString('fr-FR')}) - ${auction.status}`
      )
      console.log(
        `    → Durée: ${auction.duration}min | Round: ${auction.overtime_range}min | ~${rounds} rounds`
      )
    })
    console.log(`\n  Total: ${japaneseAuctions.length} enchère(s) Japanese\n`)
  } else {
    console.log('  Aucune enchère Japanese future\n')
  }

  // 3. Vérifier les doublons (même auction + seller + price)
  console.log('=== 3. Vérification des doublons ===\n')
  const { data: allPrebids } = await supabase
    .from('bids')
    .select('auction_id, seller_email, price, cloud_task, id')
    .eq('type', 'prebid')
    .not('cloud_task', 'is', null)

  const grouped = {}
  allPrebids?.forEach((bid) => {
    const key = `${bid.auction_id}_${bid.seller_email}_${bid.price}`
    if (!grouped[key]) {
      grouped[key] = []
    }
    grouped[key].push(bid)
  })

  const duplicates = Object.entries(grouped).filter(([_, bids]) => bids.length > 1)

  if (duplicates.length > 0) {
    console.log('  ⚠️ DOUBLONS DÉTECTÉS:\n')
    duplicates.forEach(([key, bids]) => {
      console.log(`  Clé: ${key}`)
      console.log(`    → ${bids.length} prebids identiques`)
      bids.forEach((bid) => {
        console.log(`      - Bid ${bid.id.substring(0, 8)}...`)
        console.log(`        Task: ${bid.cloud_task.split('/').pop()}`)
      })
      console.log('')
    })
  } else {
    console.log('  ✅ Aucun doublon détecté\n')
  }

  // 4. Count par date d'enchère
  console.log('=== 4. Distribution des prebids par date ===\n')
  const { data: prebidsByDate } = await supabase.rpc('execute_sql', {
    query: `
      SELECT
        DATE(a.start_at) as auction_date,
        COUNT(b.id) as prebids_count
      FROM auctions a
      JOIN bids b ON b.auction_id = a.id
      WHERE b.type = 'prebid'
        AND b.cloud_task IS NOT NULL
        AND a.start_at > NOW()
        AND a.deleted = false
      GROUP BY DATE(a.start_at)
      ORDER BY auction_date
    `
  })

  if (prebidsByDate?.length) {
    prebidsByDate.forEach((row) => {
      console.log(
        `  ${new Date(row.auction_date).toLocaleDateString('fr-FR')}: ${row.prebids_count} prebid(s)`
      )
    })
  }

  // 5. Tasks sur enchères passées (anomalie)
  console.log('\n=== 5. Tasks sur enchères PASSÉES (anomalie) ===\n')
  const { data: pastAuctions } = await supabase
    .from('auctions')
    .select(
      `
      id,
      name,
      type,
      status,
      end_at,
      bids!inner(id, cloud_task)
    `
    )
    .eq('bids.type', 'prebid')
    .not('bids.cloud_task', 'is', null)
    .lt('end_at', new Date().toISOString())
    .eq('deleted', false)

  if (pastAuctions?.length) {
    console.log('  ⚠️ ANOMALIE: Des Cloud Tasks existent pour des enchères terminées:\n')
    pastAuctions.forEach((auction) => {
      console.log(
        `  ${auction.name} (${auction.type}) - Fin: ${new Date(auction.end_at).toLocaleString('fr-FR')}`
      )
      console.log(`    → ${auction.bids.length} prebid(s) avec Cloud Task encore actifs`)
    })
  } else {
    console.log('  ✅ Aucune task sur enchère passée\n')
  }

  // 6. Compter TOUS les prebids avec cloud_task (incluant deleted)
  console.log('=== 6. Total prebids avec cloud_task (incluant deleted) ===\n')
  const { count: totalWithTasks } = await supabase
    .from('bids')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'prebid')
    .not('cloud_task', 'is', null)

  console.log(`  Total prebids avec cloud_task en DB: ${totalWithTasks}`)
  console.log(`  Total Cloud Tasks dans GCP: 16 (15 PROD + 1 test)`)

  if (totalWithTasks < 16) {
    console.log(`\n  ⚠️ ANOMALIE: ${16 - totalWithTasks} Cloud Tasks orphelines dans GCP!`)
    console.log(`     Ces tasks n'ont plus de prebid correspondant en base.`)
    console.log(`     Elles s'exécuteront mais échoueront (prebid introuvable ou enchère fermée).`)
  }

  // 7. Prebids récents SANS cloud_task (besoin de réparation)
  console.log('\n=== 7. Prebids récents SANS cloud_task (à réparer) ===\n')
  const { data: orphanPrebids } = await supabase
    .from('bids')
    .select(
      `
      id,
      price,
      created_at,
      auction:auctions(id, name, type, start_at, end_at, status)
    `
    )
    .eq('type', 'prebid')
    .is('cloud_task', null)
    .gt('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
    .order('created_at', { ascending: false })
    .limit(20)

  if (orphanPrebids?.length) {
    const dutchOrphans = orphanPrebids.filter(
      (b) => b.auction?.type === 'dutch' && new Date(b.auction.end_at) > new Date()
    )
    const nonDutchOrphans = orphanPrebids.filter(
      (b) => b.auction?.type !== 'dutch' || new Date(b.auction.end_at) <= new Date()
    )

    if (dutchOrphans.length > 0) {
      console.log('  ⚠️ Prebids Dutch SANS Cloud Task (besoin de réparation):\n')
      dutchOrphans.forEach((bid) => {
        console.log(`    • ${bid.auction.name} (${bid.auction.type})`)
        console.log(`      Bid ID: ${bid.id}`)
        console.log(`      Prix: ${bid.price}`)
        console.log('')
      })
    }

    if (nonDutchOrphans.length > 0) {
      console.log('  ℹ️ Prebids non-Dutch SANS Cloud Task (normal):\n')
      nonDutchOrphans.forEach((bid) => {
        console.log(`    • ${bid.auction?.name || 'Unknown'} (${bid.auction?.type || 'Unknown'})`)
      })
      console.log('')
    }

    if (dutchOrphans.length === 0 && nonDutchOrphans.length === 0) {
      console.log('  ✅ Aucun prebid récent sans cloud_task\n')
    }
  } else {
    console.log('  ✅ Aucun prebid récent sans cloud_task\n')
  }

  console.log('\n✅ Analyse terminée')
}

main().catch(console.error)
