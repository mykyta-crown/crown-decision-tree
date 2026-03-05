#!/usr/bin/env node

/**
 * Analyse les Cloud Tasks Japanese et identifie les orphelines
 * Usage: node scripts/analyze_japanese_tasks.js --prod [--delete-orphans]
 */

import { CloudTasksClient } from '@google-cloud/tasks'
import { createClient } from '@supabase/supabase-js'
import { loadEnv, validateEnv } from './lib/env-loader.js'
import dayjs from 'dayjs'

// Load environment
loadEnv()
validateEnv(['SUPABASE_URL', 'SUPABASE_ADMIN_KEY'])

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

const GCP_PROJECT = 'crown-476614'
const GCP_LOCATION = 'europe-west1'
const QUEUE_NAME = 'JapaneseRoundHandler'

const DELETE_ORPHANS = process.argv.includes('--delete-orphans')

// Parse task body
function parseTaskBody(bodyRaw) {
  if (!bodyRaw) return null
  let payloadJson
  if (bodyRaw instanceof Uint8Array || Buffer.isBuffer(bodyRaw)) {
    payloadJson = Buffer.from(bodyRaw).toString('utf-8')
  } else if (typeof bodyRaw === 'string') {
    payloadJson = Buffer.from(bodyRaw, 'base64').toString('utf-8')
  } else {
    throw new Error(`Unknown body type: ${typeof bodyRaw}`)
  }
  return JSON.parse(payloadJson)
}

async function main() {
  console.log('🔍 ANALYSE DES CLOUD TASKS JAPANESE\n')
  console.log('================================================\n')

  if (DELETE_ORPHANS) {
    console.log('⚠️  MODE SUPPRESSION ACTIVÉ - Les tâches orphelines seront supprimées\n')
  } else {
    console.log('📊 MODE ANALYSE - Aucune modification ne sera effectuée\n')
  }

  // Initialize Cloud Tasks client
  const tasksClient = new CloudTasksClient()
  const queuePath = tasksClient.queuePath(GCP_PROJECT, GCP_LOCATION, QUEUE_NAME)

  console.log('🔗 Récupération des tâches depuis GCP...\n')

  // Get all tasks
  const allTasks = []
  let pageToken = null

  do {
    const [tasks, , response] = await tasksClient.listTasks({
      parent: queuePath,
      pageSize: 100,
      pageToken,
      responseView: 'FULL'
    })

    allTasks.push(...tasks)
    pageToken = response?.nextPageToken
  } while (pageToken)

  console.log(`✅ ${allTasks.length} tâche(s) Japanese trouvée(s) dans GCP\n`)

  if (allTasks.length === 0) {
    console.log('🎉 Aucune tâche à analyser !\n')
    await tasksClient.close()
    return
  }

  // Analyze each task
  const tasksByAuction = new Map()
  const unparseable = []

  console.log('🔍 Analyse des payloads...\n')

  for (const task of allTasks) {
    try {
      const payload = parseTaskBody(task.httpRequest?.body)
      if (!payload || !payload.auction_id) {
        unparseable.push(task)
        continue
      }

      if (!tasksByAuction.has(payload.auction_id)) {
        tasksByAuction.set(payload.auction_id, [])
      }

      const scheduleTime = task.scheduleTime?.seconds
      const scheduledAt = scheduleTime ? dayjs.unix(scheduleTime) : null

      tasksByAuction.get(payload.auction_id).push({
        task,
        payload,
        scheduledAt,
        taskName: task.name
      })
    } catch (e) {
      unparseable.push(task)
    }
  }

  console.log(`📦 ${tasksByAuction.size} enchère(s) unique(s) référencée(s)\n`)
  console.log(`⚠️  ${unparseable.length} tâche(s) non parseable(s)\n`)

  // Check each auction in DB
  console.log('🗄️  Vérification en base de données...\n')

  const orphanedAuctions = []
  const pastAuctions = []
  const futureAuctions = []
  const now = dayjs()

  for (const [auctionId, tasks] of tasksByAuction) {
    // Check if auction exists
    const { data: auction, error } = await supabase
      .from('auctions')
      .select('id, name, type, start_at, end_at, status, deleted')
      .eq('id', auctionId)
      .single()

    if (error || !auction) {
      orphanedAuctions.push({ auctionId, tasks, reason: 'Auction not found in DB' })
      continue
    }

    if (auction.deleted) {
      orphanedAuctions.push({ auctionId, tasks, reason: 'Auction is deleted', auction })
      continue
    }

    if (auction.type !== 'japanese') {
      orphanedAuctions.push({
        auctionId,
        tasks,
        reason: `Wrong type: ${auction.type}`,
        auction
      })
      continue
    }

    const endAt = dayjs(auction.end_at)
    if (endAt.isBefore(now)) {
      pastAuctions.push({ auctionId, tasks, auction })
    } else {
      futureAuctions.push({ auctionId, tasks, auction })
    }
  }

  // Display results
  console.log('================================================')
  console.log('📊 RÉSULTATS\n')

  console.log(`✅ Enchères Japanese futures valides : ${futureAuctions.length}`)
  if (futureAuctions.length > 0) {
    futureAuctions.forEach(({ auction, tasks }) => {
      console.log(`   • ${auction.name} (${tasks.length} tâche(s))`)
      console.log(`     Fin: ${dayjs(auction.end_at).format('DD/MM/YYYY HH:mm')}`)
    })
  }
  console.log('')

  console.log(`🕐 Enchères Japanese PASSÉES : ${pastAuctions.length}`)
  if (pastAuctions.length > 0) {
    pastAuctions.forEach(({ auction, tasks }) => {
      console.log(`   • ${auction.name} (${tasks.length} tâche(s))`)
      console.log(
        `     Fin: ${dayjs(auction.end_at).format('DD/MM/YYYY HH:mm')} (${dayjs(auction.end_at).fromNow()})`
      )
    })
  }
  console.log('')

  console.log(`❌ Enchères ORPHELINES : ${orphanedAuctions.length}`)
  if (orphanedAuctions.length > 0) {
    orphanedAuctions.forEach(({ auctionId, tasks, reason, auction }) => {
      console.log(`   • ${auctionId.substring(0, 13)}... (${tasks.length} tâche(s))`)
      console.log(`     Raison: ${reason}`)
      if (auction) {
        console.log(`     Nom: ${auction.name}`)
      }
    })
  }
  console.log('')

  // Summary
  const totalOrphanTasks =
    [...orphanedAuctions, ...pastAuctions].reduce((sum, item) => sum + item.tasks.length, 0) +
    unparseable.length

  console.log('================================================')
  console.log('🎯 RÉSUMÉ FINAL\n')
  console.log(`Total tâches : ${allTasks.length}`)
  console.log(
    `Tâches valides (futures) : ${futureAuctions.reduce((sum, item) => sum + item.tasks.length, 0)}`
  )
  console.log(`Tâches orphelines : ${totalOrphanTasks}`)
  console.log(
    `  - Enchères passées : ${pastAuctions.reduce((sum, item) => sum + item.tasks.length, 0)}`
  )
  console.log(
    `  - Enchères supprimées/invalides : ${orphanedAuctions.reduce((sum, item) => sum + item.tasks.length, 0)}`
  )
  console.log(`  - Non parseables : ${unparseable.length}`)
  console.log('')

  // Delete orphans if requested
  if (DELETE_ORPHANS && totalOrphanTasks > 0) {
    console.log('🗑️  SUPPRESSION DES TÂCHES ORPHELINES...\n')

    const tasksToDelete = []

    // Add tasks from orphaned auctions
    orphanedAuctions.forEach(({ tasks }) => {
      tasks.forEach(({ taskName }) => tasksToDelete.push(taskName))
    })

    // Add tasks from past auctions
    pastAuctions.forEach(({ tasks }) => {
      tasks.forEach(({ taskName }) => tasksToDelete.push(taskName))
    })

    // Add unparseable tasks
    unparseable.forEach((task) => {
      tasksToDelete.push(task.name)
    })

    console.log(`🔧 Suppression de ${tasksToDelete.length} tâche(s)...\n`)

    let deleted = 0
    let errors = 0

    // Delete in batches of 10 (avoid rate limits)
    for (let i = 0; i < tasksToDelete.length; i += 10) {
      const batch = tasksToDelete.slice(i, i + 10)

      await Promise.all(
        batch.map(async (taskName) => {
          try {
            await tasksClient.deleteTask({ name: taskName })
            deleted++
            if (deleted % 50 === 0) {
              console.log(`  Progression: ${deleted}/${tasksToDelete.length}`)
            }
          } catch (err) {
            errors++
            console.error(`  ❌ Erreur suppression: ${err.message}`)
          }
        })
      )

      // Small delay between batches to avoid rate limits
      if (i + 10 < tasksToDelete.length) {
        await new Promise((resolve) => setTimeout(resolve, 100))
      }
    }

    console.log(`\n✅ Suppression terminée: ${deleted} tâche(s) supprimée(s)`)
    if (errors > 0) {
      console.log(`❌ Erreurs: ${errors}`)
    }
    console.log('')

    // Verify
    const [remainingTasks] = await tasksClient.listTasks({
      parent: queuePath,
      pageSize: 1
    })

    console.log(
      `📊 Vérification: ${remainingTasks.length > 0 ? `${remainingTasks.length}+` : '0'} tâche(s) restante(s) dans la queue\n`
    )
  } else if (totalOrphanTasks > 0) {
    console.log('💡 Pour supprimer les tâches orphelines, relancez avec:')
    console.log('   node scripts/analyze_japanese_tasks.js --prod --delete-orphans\n')
  }

  // Cleanup
  await tasksClient.close()
  console.log('✅ Analyse terminée\n')
}

main().catch(console.error)
