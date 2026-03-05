/**
 * Script: Add Credits to User
 * Adds credits to a specific user by email
 *
 * Usage: node scripts/addCredits.js <email> <amount>
 * Example: node scripts/addCredits.js nastyakuzmenko550@gmail.com 1000
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Charger les variables d'environnement
dotenv.config()

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ADMIN_KEY || process.env.SUPABASE_SERVICE_KEY
)

async function addCreditsToUser(email, amount) {
  console.log('💳 Starting credit addition process...\n')
  console.log(`📧 User Email: ${email}`)
  console.log(`💰 Amount: ${amount} credits\n`)

  try {
    // 1. Trouver l'utilisateur par email
    console.log('🔍 Looking up user...')
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, email, role, first_name, last_name')
      .eq('email', email)
      .single()

    if (profileError || !profiles) {
      console.error('❌ User not found with email:', email)
      console.error('Error:', profileError)
      return
    }

    console.log('✅ User found:')
    console.log(`   ID: ${profiles.id}`)
    console.log(`   Name: ${profiles.first_name} ${profiles.last_name}`)
    console.log(`   Role: ${profiles.role}\n`)

    // 2. Récupérer le solde actuel
    console.log('📊 Fetching current balance...')
    const { data: currentCredits } = await supabase.rpc('get_user_credits', {
      p_user_id: profiles.id
    })

    const currentBalance = currentCredits?.[0] || { credits_remaining: 0, credits_total: 0 }
    console.log(`   Current remaining: ${currentBalance.credits_remaining}`)
    console.log(`   Current total: ${currentBalance.credits_total}\n`)

    // 3. Ajouter les crédits via RPC
    console.log('💳 Adding credits...')
    const { error: addError } = await supabase.rpc('add_user_credits', {
      p_user_id: profiles.id,
      p_amount: amount
    })

    if (addError) {
      console.error('❌ Error adding credits:', addError)
      return
    }

    // 4. Vérifier le nouveau solde
    console.log('✅ Credits added successfully!\n')
    const { data: newCredits } = await supabase.rpc('get_user_credits', {
      p_user_id: profiles.id
    })

    const newBalance = newCredits?.[0] || { credits_remaining: 0, credits_total: 0 }
    console.log('📊 New balance:')
    console.log(`   Remaining: ${newBalance.credits_remaining} (+${amount})`)
    console.log(`   Total: ${newBalance.credits_total} (+${amount})`)

    console.log('\n🎉 Operation completed successfully!')
  } catch (error) {
    console.error('❌ Operation failed:', error)
  }
}

// Récupérer les arguments de la ligne de commande
const args = process.argv.slice(2)

if (args.length !== 2) {
  console.error('Usage: node scripts/addCredits.js <email> <amount>')
  console.error('Example: node scripts/addCredits.js user@example.com 1000')
  process.exit(1)
}

const email = args[0]
const amount = parseInt(args[1], 10)

if (isNaN(amount) || amount <= 0) {
  console.error('❌ Amount must be a positive number')
  process.exit(1)
}

// Exécuter l'ajout de crédits
addCreditsToUser(email, amount)
