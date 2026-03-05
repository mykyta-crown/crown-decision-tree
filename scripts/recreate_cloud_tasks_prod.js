#!/usr/bin/env node

/**
 * Recrée les Cloud Tasks pour les enchères futures
 * Usage: node scripts/recreate_cloud_tasks_prod.js --prod
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv, validateEnv, displayEnv } from './lib/env-loader.js'

// Load environment variables (supports --prod flag)
loadEnv()
validateEnv(['SUPABASE_URL', 'SUPABASE_ADMIN_KEY', 'WEBHOOK_BEARER_TOKEN'])

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ADMIN_KEY
const webhookToken = process.env.WEBHOOK_BEARER_TOKEN
const webhookBaseUrl = process.env.GCP_ENDPOINT || 'https://app.crown-procurement.com'

const supabase = createClient(supabaseUrl, supabaseKey)

async function recreateDutchPrebidTasks() {
  console.log('🔧 Recréation des Cloud Tasks pour prebids Dutch...\n')

  // Trouver tous les prebids Dutch sans cloud_task sur enchères futures
  const { data: prebids, error } = await supabase
    .from('bids')
    .select(
      `
      *,
      auction:auctions!inner(
        id,
        name,
        type,
        start_at,
        end_at,
        status,
        deleted
      )
    `
    )
    .eq('type', 'prebid')
    .is('cloud_task', null)
    .eq('auction.type', 'dutch')
    .gt('auction.end_at', new Date().toISOString())
    .eq('auction.deleted', false)

  if (error) {
    console.error('❌ Erreur:', error.message)
    return { success: 0, skipped: 0, failed: 0 }
  }

  if (!prebids || prebids.length === 0) {
    console.log('✅ Aucun prebid Dutch à réparer\n')
    return { success: 0, skipped: 0, failed: 0 }
  }

  console.log(`📋 ${prebids.length} prebid(s) Dutch à réparer:\n`)

  let success = 0
  let failed = 0

  for (const bid of prebids) {
    try {
      console.log(`  • ${bid.auction.name}`)
      console.log(`    Prebid: ${bid.id.substring(0, 8)}... | Prix: ${bid.price}`)

      // Créer un payload clean sans les relations nested
      const bidPayload = {
        id: bid.id,
        auction_id: bid.auction_id,
        seller_id: bid.seller_id,
        seller_email: bid.seller_email,
        price: bid.price,
        type: bid.type,
        created_at: bid.created_at
      }

      // Appeler le webhook insert_bid pour recréer la Cloud Task
      const response = await fetch(`${webhookBaseUrl}/api/v1/webhooks/bids/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${webhookToken}`
        },
        body: JSON.stringify({ record: bidPayload })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Webhook failed (${response.status}): ${text}`)
      }

      // Vérifier que cloud_task a été créé
      const { data: updatedBid } = await supabase
        .from('bids')
        .select('cloud_task')
        .eq('id', bid.id)
        .single()

      if (updatedBid?.cloud_task) {
        const taskId = updatedBid.cloud_task.split('/').pop()
        console.log(`    ✅ Cloud Task créée: ${taskId}\n`)
        success++
      } else {
        console.log(`    ⚠️  Cloud Task non créée (vérifier logs)\n`)
        failed++
      }
    } catch (err) {
      console.error(`    ❌ Erreur: ${err.message}\n`)
      failed++
    }
  }

  return { success, skipped: 0, failed }
}

async function recreateJapaneseRoundTasks() {
  console.log('🔧 Recréation des Cloud Tasks pour enchères Japanese...\n')

  // Trouver toutes les enchères Japanese futures
  const { data: auctions, error } = await supabase
    .from('auctions')
    .select('id, name, type, start_at, end_at, status, duration, overtime_range')
    .eq('type', 'japanese')
    .gt('start_at', new Date().toISOString())
    .eq('deleted', false)
    .order('start_at', { ascending: true })

  if (error) {
    console.error('❌ Erreur:', error.message)
    return { success: 0, skipped: 0, failed: 0 }
  }

  if (auctions.length === 0) {
    console.log('✅ Aucune enchère Japanese future\n')
    return { success: 0, skipped: 0, failed: 0 }
  }

  console.log(`📋 ${auctions.length} enchère(s) Japanese à programmer:\n`)

  let success = 0
  let failed = 0

  for (const auction of auctions) {
    try {
      const rounds = Math.ceil(auction.duration / auction.overtime_range)
      console.log(`  • ${auction.name}`)
      console.log(`    Début: ${new Date(auction.start_at).toLocaleString('fr-FR')}`)
      console.log(`    ~${rounds} rounds à programmer`)

      // Appeler le webhook insert_auction pour créer les rounds
      const response = await fetch(`${webhookBaseUrl}/api/v1/webhooks/auctions/insert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${webhookToken}`
        },
        body: JSON.stringify({ record: auction })
      })

      if (!response.ok) {
        const text = await response.text()
        throw new Error(`Webhook failed (${response.status}): ${text}`)
      }

      console.log(`    ✅ Rounds programmés\n`)
      success++
    } catch (err) {
      console.error(`    ❌ Erreur: ${err.message}\n`)
      failed++
    }
  }

  return { success, skipped: 0, failed }
}

async function main() {
  console.log('🚀 RECRÉATION DES CLOUD TASKS PROD\n')
  console.log('================================================\n')

  // 1. Dutch prebids
  const dutchResults = await recreateDutchPrebidTasks()

  // 2. Japanese rounds
  const japaneseResults = await recreateJapaneseRoundTasks()

  // Résumé final
  console.log('================================================')
  console.log('📊 RÉSUMÉ FINAL\n')
  console.log('Dutch prebids:')
  console.log(`  ✅ Succès: ${dutchResults.success}`)
  console.log(`  ❌ Échecs: ${dutchResults.failed}`)
  console.log('')
  console.log('Japanese rounds:')
  console.log(`  ✅ Succès: ${japaneseResults.success}`)
  console.log(`  ❌ Échecs: ${japaneseResults.failed}`)
  console.log('')
  console.log(`Total: ${dutchResults.success + japaneseResults.success} Cloud Tasks créées`)
}

main().catch(console.error)
