#!/usr/bin/env node

/**
 * Nettoie les doublons d'entreprises dans la base de données
 *
 * Ce script:
 * 1. Identifie les groupes de doublons par nom (case-insensitive)
 * 2. Pour chaque groupe, garde l'entreprise "principale" (celle avec le plus d'auctions/profiles)
 * 3. Migre les références (profiles.company_id, auctions.company_id, gpt_access.company_id)
 * 4. Supprime les entreprises en double
 *
 * Usage:
 *   node scripts/run.js cleanup_duplicate_companies.js --prod --dry-run  # Test
 *   node scripts/run.js cleanup_duplicate_companies.js --prod --execute  # Exécution
 */

import { createClient } from '@supabase/supabase-js'
import { loadEnv, validateEnv } from './lib/env-loader.js'

// Load environment
loadEnv()
validateEnv(['SUPABASE_URL', 'SUPABASE_ADMIN_KEY'])

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ADMIN_KEY)

const DRY_RUN = !process.argv.includes('--execute')

console.log("🔍 NETTOYAGE DES DOUBLONS D'ENTREPRISES\n")
console.log('================================================\n')

if (DRY_RUN) {
  console.log('📊 MODE DRY-RUN - Aucune modification\n')
} else {
  console.log('🔴 MODE EXECUTION - Les données seront MODIFIÉES\n')
}

// Étape 1: Récupérer toutes les entreprises
console.log('🗄️  Récupération des entreprises...\n')

const { data: companies, error: companiesError } = await supabase
  .from('companies')
  .select('id, name, created_at')
  .order('created_at', { ascending: true })

if (companiesError) {
  console.error('❌ Erreur lors de la récupération des entreprises:', companiesError)
  process.exit(1)
}

console.log(`✅ ${companies.length} entreprise(s) au total\n`)

// Étape 2: Identifier les groupes de doublons (par nom, case-insensitive)
const duplicateGroups = {}

for (const company of companies) {
  const normalizedName = company.name?.toLowerCase()?.trim()
  if (!normalizedName) continue

  if (!duplicateGroups[normalizedName]) {
    duplicateGroups[normalizedName] = []
  }
  duplicateGroups[normalizedName].push(company)
}

// Filtrer pour ne garder que les groupes avec des doublons
const groupsWithDuplicates = Object.entries(duplicateGroups)
  .filter(([, group]) => group.length > 1)
  .sort((a, b) => b[1].length - a[1].length)

console.log(`📊 ${groupsWithDuplicates.length} groupe(s) avec doublons détecté(s)\n`)

if (groupsWithDuplicates.length === 0) {
  console.log('✅ Aucun doublon à nettoyer !')
  process.exit(0)
}

// Étape 3: Pour chaque groupe, déterminer l'entreprise principale
console.log('🔎 Analyse des doublons...\n')

const mergeOperations = []

for (const [normalizedName, group] of groupsWithDuplicates) {
  console.log(`\n📦 "${group[0].name}" (${group.length} doublons)`)

  // Récupérer les stats pour chaque entreprise du groupe
  const companyStats = await Promise.all(
    group.map(async (company) => {
      // Compter les profiles liés
      const { count: profileCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)

      // Compter les auctions liées
      const { count: auctionCount } = await supabase
        .from('auctions')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)

      // Compter les gpt_access liés
      const { count: gptAccessCount } = await supabase
        .from('gpt_access')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', company.id)

      return {
        ...company,
        profileCount: profileCount || 0,
        auctionCount: auctionCount || 0,
        gptAccessCount: gptAccessCount || 0,
        totalActivity: (profileCount || 0) + (auctionCount || 0) + (gptAccessCount || 0)
      }
    })
  )

  // Trier par activité décroissante, puis par date de création (plus ancienne = prioritaire)
  companyStats.sort((a, b) => {
    if (b.totalActivity !== a.totalActivity) {
      return b.totalActivity - a.totalActivity
    }
    return new Date(a.created_at) - new Date(b.created_at)
  })

  const primaryCompany = companyStats[0]
  const duplicatesToMerge = companyStats.slice(1)

  console.log(`   ✅ Principale: ${primaryCompany.id}`)
  console.log(`      - Profiles: ${primaryCompany.profileCount}`)
  console.log(`      - Auctions: ${primaryCompany.auctionCount}`)
  console.log(`      - GPT Access: ${primaryCompany.gptAccessCount}`)

  for (const dup of duplicatesToMerge) {
    console.log(`   ❌ À fusionner: ${dup.id}`)
    console.log(`      - Profiles: ${dup.profileCount}`)
    console.log(`      - Auctions: ${dup.auctionCount}`)
    console.log(`      - GPT Access: ${dup.gptAccessCount}`)

    mergeOperations.push({
      primaryId: primaryCompany.id,
      duplicateId: dup.id,
      duplicateName: dup.name,
      profileCount: dup.profileCount,
      auctionCount: dup.auctionCount,
      gptAccessCount: dup.gptAccessCount
    })
  }
}

console.log('\n================================================')
console.log('📊 RÉSUMÉ\n')
console.log(`Groupes avec doublons: ${groupsWithDuplicates.length}`)
console.log(`Entreprises à fusionner: ${mergeOperations.length}`)
console.log('')

const totalProfiles = mergeOperations.reduce((sum, op) => sum + op.profileCount, 0)
const totalAuctions = mergeOperations.reduce((sum, op) => sum + op.auctionCount, 0)
const totalGptAccess = mergeOperations.reduce((sum, op) => sum + op.gptAccessCount, 0)

console.log(`Références à migrer:`)
console.log(`  - Profiles: ${totalProfiles}`)
console.log(`  - Auctions: ${totalAuctions}`)
console.log(`  - GPT Access: ${totalGptAccess}`)
console.log('')

if (DRY_RUN) {
  console.log('💡 Pour exécuter la fusion, relancez avec:')
  console.log('   node scripts/run.js cleanup_duplicate_companies.js --prod --execute')
  console.log('')
  process.exit(0)
}

// Étape 4: Exécuter les fusions
console.log('🔧 Exécution des fusions...\n')

let successCount = 0
let errorCount = 0

for (const operation of mergeOperations) {
  console.log(`\n🔄 Fusion de ${operation.duplicateId} → ${operation.primaryId}`)

  try {
    // Migrer les profiles
    if (operation.profileCount > 0) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ company_id: operation.primaryId })
        .eq('company_id', operation.duplicateId)

      if (profileError) throw new Error(`Profiles: ${profileError.message}`)
      console.log(`   ✅ ${operation.profileCount} profile(s) migré(s)`)
    }

    // Migrer les auctions
    if (operation.auctionCount > 0) {
      const { error: auctionError } = await supabase
        .from('auctions')
        .update({ company_id: operation.primaryId })
        .eq('company_id', operation.duplicateId)

      if (auctionError) throw new Error(`Auctions: ${auctionError.message}`)
      console.log(`   ✅ ${operation.auctionCount} auction(s) migrée(s)`)
    }

    // Migrer les gpt_access
    if (operation.gptAccessCount > 0) {
      const { error: gptError } = await supabase
        .from('gpt_access')
        .update({ company_id: operation.primaryId })
        .eq('company_id', operation.duplicateId)

      if (gptError) throw new Error(`GPT Access: ${gptError.message}`)
      console.log(`   ✅ ${operation.gptAccessCount} gpt_access migré(s)`)
    }

    // Supprimer l'entreprise en double
    const { error: deleteError } = await supabase
      .from('companies')
      .delete()
      .eq('id', operation.duplicateId)

    if (deleteError) throw new Error(`Delete: ${deleteError.message}`)
    console.log(`   ✅ Entreprise ${operation.duplicateId} supprimée`)

    successCount++
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`)
    errorCount++
  }
}

console.log('\n================================================')
console.log('📊 RÉSULTAT FINAL\n')
console.log(`✅ Fusions réussies: ${successCount}`)
console.log(`❌ Fusions échouées: ${errorCount}`)
console.log('')

// Vérification finale
const { data: remainingCompanies } = await supabase.from('companies').select('name')

const remainingDuplicates = {}
for (const c of remainingCompanies || []) {
  const normalized = c.name?.toLowerCase()?.trim()
  if (!normalized) continue
  remainingDuplicates[normalized] = (remainingDuplicates[normalized] || 0) + 1
}

const stillDuplicates = Object.entries(remainingDuplicates).filter(([, count]) => count > 1)

if (stillDuplicates.length > 0) {
  console.log('⚠️  Doublons restants:')
  stillDuplicates.forEach(([name, count]) => {
    console.log(`   - "${name}": ${count} occurrences`)
  })
} else {
  console.log('🎉 Tous les doublons ont été fusionnés !')
}

console.log('')
