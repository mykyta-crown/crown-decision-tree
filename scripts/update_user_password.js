#!/usr/bin/env node

/**
 * Script pour mettre à jour le mot de passe d'un utilisateur
 *
 * Usage:
 *   node scripts/update_user_password.js email@example.com nouveauMotDePasse
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

async function updateUserPassword(email, newPassword) {
  console.log('\n🔐 Mise à jour du mot de passe utilisateur\n')
  console.log(`📧 Email: ${email}`)
  console.log(`🔑 Nouveau mot de passe: ${newPassword}`)
  console.log()

  try {
    // 1. Récupérer l'utilisateur par email
    console.log("1️⃣ Recherche de l'utilisateur...")
    const { data: users, error: listError } = await supabase.auth.admin.listUsers()

    if (listError) {
      console.error('❌ Erreur lors de la récupération des utilisateurs:', listError)
      return false
    }

    const user = users.users.find((u) => u.email === email)

    if (!user) {
      console.error('❌ Utilisateur introuvable dans auth.users')
      console.log("\n💡 L'utilisateur n'existe pas. Voulez-vous le créer ?")
      console.log('   Utilisez plutôt: node scripts/create_user_manually.js')
      return false
    }

    console.log(`✅ Utilisateur trouvé: ${user.id}`)
    console.log(`   - Créé le: ${user.created_at}`)
    console.log(`   - Email confirmé: ${user.email_confirmed_at ? 'Oui' : 'Non'}`)
    console.log(`   - Dernière connexion: ${user.last_sign_in_at || 'Jamais'}`)

    // 2. Mettre à jour le mot de passe
    console.log('\n2️⃣ Mise à jour du mot de passe...')
    const { data: updateData, error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('❌ Erreur lors de la mise à jour du mot de passe:', updateError)
      return false
    }

    console.log('✅ Mot de passe mis à jour avec succès!')

    // 3. Vérifier le profil
    console.log('\n3️⃣ Vérification du profil...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('⚠️  Erreur lors de la vérification du profil:', profileError)
    } else if (profile) {
      console.log('✅ Profil trouvé:')
      console.log(`   - Nom: ${profile.first_name} ${profile.last_name}`)
      console.log(`   - Role: ${profile.role}`)
      console.log(`   - Actif: ${profile.is_active ? 'Oui' : 'Non'}`)
      console.log(`   - Supprimé: ${profile.is_deleted ? 'Oui' : 'Non'}`)
      console.log(`   - Company ID: ${profile.company_id || 'Non défini'}`)

      if (!profile.is_active) {
        console.log("\n⚠️  ATTENTION: Le compte n'est pas actif (is_active = false)")
        console.log("   L'utilisateur ne pourra pas se connecter même avec le nouveau mot de passe")
      }

      if (profile.is_deleted) {
        console.log('\n⚠️  ATTENTION: Le compte est marqué comme supprimé (is_deleted = true)')
        console.log("   L'utilisateur ne pourra pas se connecter")
      }
    } else {
      console.log('⚠️  Aucun profil trouvé dans la table profiles')
      console.log("   L'utilisateur existe dans auth.users mais pas dans profiles")
      console.log('   Cela peut causer des problèmes de connexion')
    }

    return true
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    return false
  }
}

// Main
async function main() {
  const email = process.argv[2]
  const password = process.argv[3]

  if (!email || !password) {
    console.error(
      '❌ Usage: node scripts/update_user_password.js email@example.com nouveauMotDePasse'
    )
    process.exit(1)
  }

  console.log('╔═══════════════════════════════════════════════════════╗')
  console.log('║       Mise à jour du mot de passe utilisateur        ║')
  console.log('╚═══════════════════════════════════════════════════════╝')

  const success = await updateUserPassword(email, password)

  console.log('\n' + '═'.repeat(55))
  if (success) {
    console.log('✅ MOT DE PASSE MIS À JOUR')
    console.log("\n💡 L'utilisateur peut maintenant se connecter avec:")
    console.log(`   Email: ${email}`)
    console.log(`   Mot de passe: ${password}`)
  } else {
    console.log('❌ ÉCHEC DE LA MISE À JOUR')
  }
  console.log('═'.repeat(55) + '\n')

  process.exit(success ? 0 : 1)
}

main()
