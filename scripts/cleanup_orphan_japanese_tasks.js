#!/usr/bin/env node

/**
 * Cleanup Orphan Japanese Auction Tasks
 *
 * Usage:
 *   node scripts/run.js cleanup_orphan_japanese_tasks.js [--production|--local] [--delete]
 *
 * Examples:
 *   # Analyze with production environment
 *   node scripts/run.js cleanup_orphan_japanese_tasks.js --production
 *
 *   # Delete orphan tasks in production
 *   node scripts/run.js cleanup_orphan_japanese_tasks.js --production --delete
 *
 *   # Analyze with local environment
 *   node scripts/run.js cleanup_orphan_japanese_tasks.js --local
 */

import { createClient } from '@supabase/supabase-js'
import { CloudTasksClient } from '@google-cloud/tasks'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc.js'
import duration from 'dayjs/plugin/duration.js'

dayjs.extend(utc)
dayjs.extend(duration)

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jgwbqdpxygwsnswtnrxf.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY
const GCP_PROJECT = 'crown-476614'
const GCP_LOCATION = 'europe-west1'
const QUEUE_NAME = 'JaponeseRoundHandler'

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing environment variables: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ADMIN_KEY')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
const client = new CloudTasksClient()

/**
 * Récupère toutes les tâches de la queue JaponeseRoundHandler
 */
async function listJapaneseTasks() {
  const queuePath = `projects/${GCP_PROJECT}/locations/${GCP_LOCATION}/queues/${QUEUE_NAME}`

  try {
    const [response] = await client.listTasks({
      parent: queuePath,
      responseView: 'FULL'
    })

    return response.map((task) => {
      const scheduleTime = task.scheduleTime
        ? dayjs.unix(parseInt(task.scheduleTime.seconds))
        : null

      // Parse le body pour extraire l'auction_id
      let auctionId = null
      let roundInfo = null
      try {
        if (task.httpRequest?.body) {
          const bodyStr = Buffer.from(task.httpRequest.body, 'base64').toString('utf-8')
          const body = JSON.parse(bodyStr)
          auctionId = body.auction?.id
          roundInfo = body.round
        }
      } catch (e) {
        console.warn(`⚠️  Cannot parse task body: ${task.name}`)
      }

      return {
        name: task.name,
        taskId: task.name.split('/').pop(),
        scheduleTime,
        scheduleDateStr: scheduleTime ? scheduleTime.format('YYYY-MM-DD HH:mm:ss') : 'N/A',
        auctionId,
        roundInfo
      }
    })
  } catch (error) {
    console.error('❌ Error listing tasks:', error.message)
    throw error
  }
}

/**
 * Récupère toutes les enchères japonaises
 */
async function listJapaneseAuctions() {
  const { data, error } = await supabase
    .from('auctions')
    .select('id, name, start_at, end_at, status, usage')
    .eq('type', 'japanese')
    .order('start_at', { ascending: false })

  if (error) {
    console.error('❌ Error fetching auctions:', error.message)
    throw error
  }

  return data
}

/**
 * Supprime une tâche Cloud Tasks
 */
async function deleteTask(taskName) {
  try {
    await client.deleteTask({ name: taskName })
    return true
  } catch (error) {
    console.error(`❌ Error deleting task ${taskName}:`, error.message)
    return false
  }
}

/**
 * Analyse et affiche les tâches orphelines
 */
async function analyzeOrphanTasks() {
  console.log('🔍 Analyzing Japanese auction tasks...\n')

  // Récupérer les tâches et les enchères
  const tasks = await listJapaneseTasks()
  const auctions = await listJapaneseAuctions()

  console.log(`📊 Found ${tasks.length} tasks in queue`)
  console.log(`📊 Found ${auctions.length} Japanese auctions in database\n`)

  // Créer un Set des IDs d'enchères valides
  const validAuctionIds = new Set(auctions.map((a) => a.id))

  // Filtrer par date si demandé (30/12)
  const tasksOn1230 = tasks.filter((task) => {
    if (!task.scheduleTime) return false
    const date = task.scheduleTime.format('MM-DD')
    return date === '12-30'
  })

  console.log(`📅 Tasks scheduled for December 30th: ${tasksOn1230.length}\n`)

  // Identifier les tâches orphelines
  const orphanTasks = tasksOn1230.filter((task) => !validAuctionIds.has(task.auctionId))

  console.log(`🚨 Orphan tasks (no matching auction): ${orphanTasks.length}\n`)

  if (orphanTasks.length > 0) {
    console.log('📋 Orphan tasks details:\n')
    orphanTasks.forEach((task, index) => {
      console.log(`${index + 1}. Task ID: ${task.taskId}`)
      console.log(`   Auction ID: ${task.auctionId || 'N/A'}`)
      console.log(`   Scheduled: ${task.scheduleDateStr}`)
      console.log(`   Round info: ${task.roundInfo ? JSON.stringify(task.roundInfo) : 'N/A'}`)
      console.log()
    })
  }

  // Afficher les enchères valides pour référence
  const auctionsWithTasks = auctions.filter((auction) => {
    return tasks.some((task) => task.auctionId === auction.id)
  })

  if (auctionsWithTasks.length > 0) {
    console.log('✅ Valid auctions with scheduled tasks:\n')
    auctionsWithTasks.forEach((auction, index) => {
      const auctionTasks = tasks.filter((t) => t.auctionId === auction.id)
      console.log(`${index + 1}. ${auction.name} (${auction.id})`)
      console.log(`   Start: ${auction.start_at}`)
      console.log(`   End: ${auction.end_at}`)
      console.log(`   Status: ${auction.status || 'N/A'}`)
      console.log(`   Usage: ${auction.usage || 'N/A'}`)
      console.log(`   Tasks: ${auctionTasks.length}`)
      console.log()
    })
  }

  return orphanTasks
}

/**
 * Nettoie les tâches orphelines
 */
async function cleanupOrphanTasks(orphanTasks, dryRun = true) {
  if (orphanTasks.length === 0) {
    console.log('✅ No orphan tasks to clean up!')
    return
  }

  if (dryRun) {
    console.log('\n🔍 DRY RUN MODE - No tasks will be deleted')
    console.log(`Would delete ${orphanTasks.length} orphan tasks`)
    return
  }

  console.log(`\n🗑️  Deleting ${orphanTasks.length} orphan tasks...\n`)

  let successCount = 0
  let failCount = 0

  for (const task of orphanTasks) {
    const success = await deleteTask(task.name)
    if (success) {
      successCount++
      console.log(`✅ Deleted: ${task.taskId}`)
    } else {
      failCount++
      console.log(`❌ Failed: ${task.taskId}`)
    }
  }

  console.log(`\n✅ Successfully deleted: ${successCount}`)
  console.log(`❌ Failed: ${failCount}`)
}

/**
 * Main
 */
async function main() {
  try {
    const orphanTasks = await analyzeOrphanTasks()

    // Demander confirmation pour supprimer
    if (orphanTasks.length > 0) {
      console.log('\n' + '='.repeat(60))
      console.log('⚠️  To delete these orphan tasks, run:')
      console.log('   node scripts/cleanup_orphan_japanese_tasks.js --delete')
      console.log('='.repeat(60))

      const deleteFlag = process.argv.includes('--delete')
      if (deleteFlag) {
        console.log('\n🚨 DELETE MODE ACTIVATED\n')
        await cleanupOrphanTasks(orphanTasks, false)
      } else {
        await cleanupOrphanTasks(orphanTasks, true)
      }
    }
  } catch (error) {
    console.error('💥 Fatal error:', error)
    process.exit(1)
  }
}

main()
