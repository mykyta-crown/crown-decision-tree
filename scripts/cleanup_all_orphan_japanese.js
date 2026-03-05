#!/usr/bin/env node

/**
 * Nettoie TOUTES les tâches Japanese orphelines (auctions n'existant plus en DB)
 * Usage: node scripts/cleanup_all_orphan_japanese.js --prod [--execute]
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv, validateEnv } from './lib/env-loader.js'
import { spawnSync } from 'child_process'
import dayjs from 'dayjs'

// Load environment
loadEnv()
validateEnv(['SUPABASE_URL', 'SUPABASE_ADMIN_KEY'])

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

const GCP_PROJECT = 'crown-476614'
const GCP_LOCATION = 'europe-west1'
const QUEUE_NAME = 'JaponeseRoundHandler'

const EXECUTE = process.argv.includes('--execute')

console.log('🔍 NETTOYAGE DES TÂCHES JAPANESE ORPHELINES\n')
console.log('================================================\n')

if (EXECUTE) {
  console.log('🔴 MODE EXECUTION - Les tâches seront SUPPRIMÉES\n')
} else {
  console.log('📊 MODE DRY-RUN - Aucune modification\n')
}

// Get all future Japanese auctions from DB
console.log('🗄️  Récupération des enchères Japanese futures en DB...\n')

const { data: futureAuctions } = await supabase
  .from('auctions')
  .select('id, name, start_at, end_at')
  .eq('type', 'japanese')
  .gte('end_at', new Date().toISOString())
  .eq('deleted', false)

console.log(`✅ ${futureAuctions?.length || 0} enchère(s) Japanese future(s) en DB\n`)

if (futureAuctions && futureAuctions.length > 0) {
  futureAuctions.forEach((a) => {
    console.log(`  • ${a.name}`)
    console.log(`    Fin: ${dayjs(a.end_at).format('DD/MM/YYYY HH:mm')}`)
  })
  console.log('')
}

// Get count of Cloud Tasks
console.log('☁️  Comptage des Cloud Tasks...\n')

const countResult = spawnSync(
  'gcloud',
  [
    'tasks',
    'list',
    `--queue=${QUEUE_NAME}`,
    `--location=${GCP_LOCATION}`,
    `--project=${GCP_PROJECT}`,
    '--format=value(name)'
  ],
  { encoding: 'utf-8' }
)

if (countResult.error || countResult.status !== 0) {
  console.error('❌ Erreur lors du comptage des tasks:', countResult.stderr)
  process.exit(1)
}

const taskCount = countResult.stdout
  .trim()
  .split('\n')
  .filter((l) => l).length
console.log(`✅ ${taskCount} tâche(s) dans GCP\n`)

// Decision
console.log('================================================')
console.log('📊 RÉSUMÉ\n')
console.log(`Enchères Japanese futures : ${futureAuctions?.length || 0}`)
console.log(`Cloud Tasks Japanese : ${taskCount}`)
console.log('')

if (futureAuctions && futureAuctions.length > 0) {
  console.log('⚠️  ATTENTION: Des enchères Japanese futures existent !')
  console.log('   Vérification des tasks une par une nécessaire.')
  console.log('')
  console.log('💡 Utilisez plutôt: node scripts/analyze_japanese_tasks.js --prod')
  process.exit(0)
}

if (taskCount === 0) {
  console.log('✅ Aucune tâche à supprimer !')
  process.exit(0)
}

console.log(`🗑️  ${taskCount} tâche(s) orpheline(s) à supprimer`)
console.log('   (Aucune enchère Japanese future en DB)')
console.log('')

if (!EXECUTE) {
  console.log('💡 Pour exécuter la suppression, relancez avec:')
  console.log('   node scripts/cleanup_all_orphan_japanese.js --prod --execute')
  console.log('')
  process.exit(0)
}

// Execute deletion
console.log('🔧 Suppression en cours...\n')
console.log('⏳ Cela peut prendre plusieurs minutes pour 1340 tâches...\n')

// Delete all tasks (gcloud will handle pagination)
const deleteResult = spawnSync(
  'bash',
  [
    '-c',
    `gcloud tasks list --queue=${QUEUE_NAME} --location=${GCP_LOCATION} --project=${GCP_PROJECT} --format="value(name)" | xargs -P 10 -I {} gcloud tasks delete {} --quiet 2>/dev/null`
  ],
  {
    encoding: 'utf-8',
    stdio: 'inherit'
  }
)

console.log('')

if (deleteResult.error || deleteResult.status !== 0) {
  console.log('⚠️  Certaines suppressions ont échoué (normal si déjà supprimées)')
}

// Verify
console.log('📊 Vérification finale...\n')

const verifyResult = spawnSync(
  'gcloud',
  [
    'tasks',
    'list',
    `--queue=${QUEUE_NAME}`,
    `--location=${GCP_LOCATION}`,
    `--project=${GCP_PROJECT}`,
    '--format=value(name)'
  ],
  { encoding: 'utf-8' }
)

const remainingCount = verifyResult.stdout
  .trim()
  .split('\n')
  .filter((l) => l).length

console.log(`✅ Nettoyage terminé`)
console.log(`📊 Tâches restantes: ${remainingCount}\n`)

if (remainingCount > 0) {
  console.log('⚠️  Quelques tâches restent (peut-être créées pendant le nettoyage)')
  console.log('   Relancez le script si nécessaire.')
} else {
  console.log('🎉 Toutes les tâches orphelines ont été supprimées !')
}

console.log('')
