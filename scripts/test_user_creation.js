#!/usr/bin/env node

/**
 * Test script pour vérifier la création automatique de profil
 *
 * Usage:
 *   node scripts/test_user_creation.js webhook    # Test le webhook directement
 *   node scripts/test_user_creation.js full       # Crée un vrai utilisateur test
 */

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://jgwbqdpxygwsnswtnrxf.supabase.co'
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ADMIN_KEY

if (!SUPABASE_SERVICE_KEY) {
  console.error(
    "❌ SUPABASE_SERVICE_ROLE_KEY ou SUPABASE_ADMIN_KEY manquante dans les variables d'environnement"
  )
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// Test 1: Appeler le webhook directement
async function testWebhook() {
  console.log('\n🧪 Test 1: Appel direct du webhook\n')

  const testUserId = crypto.randomUUID()
  const testEmail = `test-${Date.now()}@test-crown.local`

  console.log(`📧 Email de test: ${testEmail}`)
  console.log(`🆔 User ID: ${testUserId}`)

  try {
    // Simuler l'appel du webhook
    const webhookUrl = 'http://localhost:3000/api/v1/webhooks/users/insert'
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer 1b6d37ddd7edc26729cbcf77ef0141818ed32fecd8dc5343f477f586fa709585'
      },
      body: JSON.stringify({
        record: {
          id: testUserId,
          email: testEmail
        }
      })
    })

    console.log(`\n📡 Réponse webhook: ${response.status} ${response.statusText}`)

    // Attendre un peu pour que le webhook traite
    await new Promise((resolve) => setTimeout(resolve, 1000))

    // Vérifier si le profil existe
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', testUserId)
      .maybeSingle()

    if (error) {
      console.error('❌ Erreur lors de la vérification:', error)
      return false
    }

    if (profile) {
      console.log('✅ Profil créé avec succès!')
      console.log('📋 Profil:', JSON.stringify(profile, null, 2))

      // Nettoyer
      console.log('\n🧹 Nettoyage du profil de test...')
      await supabase.from('profiles').delete().eq('id', testUserId)
      console.log('✅ Profil de test supprimé')

      return true
    } else {
      console.error('❌ Profil non créé!')
      return false
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return false
  }
}

// Test 2: Créer un vrai utilisateur via Supabase Auth
async function testFullFlow() {
  console.log("\n🧪 Test 2: Création complète d'un utilisateur\n")

  const testEmail = `test-${Date.now()}@test-crown.local`
  const testPassword = 'TestPassword123!'

  console.log(`📧 Email de test: ${testEmail}`)
  console.log(`🔐 Mot de passe: ${testPassword}`)

  try {
    // Créer l'utilisateur via Supabase Auth
    console.log("\n1️⃣ Création de l'utilisateur dans auth.users...")
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true // Auto-confirmer l'email
    })

    if (authError) {
      console.error('❌ Erreur création utilisateur:', authError)
      return false
    }

    console.log(`✅ Utilisateur créé: ${authData.user.id}`)

    // Attendre que le webhook soit appelé et traité
    console.log('\n2️⃣ Attente du traitement du webhook (5 secondes)...')
    await new Promise((resolve) => setTimeout(resolve, 5000))

    // Vérifier si le profil existe
    console.log('\n3️⃣ Vérification de la création du profil...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .maybeSingle()

    if (profileError) {
      console.error('❌ Erreur lors de la vérification:', profileError)
    }

    if (profile) {
      console.log('✅ Profil créé automatiquement!')
      console.log('📋 Profil:', JSON.stringify(profile, null, 2))

      // Nettoyer
      console.log("\n🧹 Nettoyage de l'utilisateur de test...")
      await supabase.auth.admin.deleteUser(authData.user.id)
      console.log('✅ Utilisateur de test supprimé')

      return true
    } else {
      console.error('❌ Profil NON créé automatiquement!')
      console.log("⚠️  Le webhook n'a peut-être pas fonctionné correctement")

      // Nettoyer quand même
      console.log("\n🧹 Nettoyage de l'utilisateur de test...")
      await supabase.auth.admin.deleteUser(authData.user.id)

      return false
    }
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return false
  }
}

// Main
async function main() {
  const testType = process.argv[2] || 'full'

  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║  Test de création automatique de profil utilisateur  ║')
  console.log('╚═══════════════════════════════════════════════════════╝')

  let success = false

  if (testType === 'webhook') {
    success = await testWebhook()
  } else if (testType === 'full') {
    success = await testFullFlow()
  } else {
    console.error('❌ Type de test invalide. Utilisez "webhook" ou "full"')
    process.exit(1)
  }

  console.log('\n' + '═'.repeat(55))
  console.log(success ? '✅ TEST RÉUSSI' : '❌ TEST ÉCHOUÉ')
  console.log('═'.repeat(55) + '\n')

  process.exit(success ? 0 : 1)
}

main()
