/**
 * Test pour vérifier l'état de l'utilisateur créé
 */

import { test } from '@playwright/test'
import { createTestUser, deleteTestUser, getUserProfile, supabaseAdmin } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'

test.describe('User Verification', () => {
  let testEmail: string

  test('verify user state after creation', async () => {
    testEmail = generateTestEmail()
    console.log('Creating user:', testEmail)

    // Create user with company
    await createTestUser(testEmail, VALID_TEST_PASSWORD, { createCompany: true })

    // Get user profile
    const profile = await getUserProfile(testEmail)

    console.log('\n=== USER PROFILE ===')
    console.log('Email:', profile.email)
    console.log('ID:', profile.id)
    console.log('Role:', profile.role)
    console.log('Admin:', profile.admin)
    console.log('Company ID:', profile.company_id)
    console.log('Is Active:', profile.is_active)
    console.log('Is Deleted:', profile.is_deleted)
    console.log('Onboarding Step:', profile.onboarding_step)
    console.log('Email Confirmed At:', profile.email_confirmed_at)

    // Get company if exists
    if (profile.company_id) {
      const { data: company } = await supabaseAdmin
        .from('companies')
        .select('*')
        .eq('id', profile.company_id)
        .single()

      console.log('\n=== COMPANY ===')
      console.log('Company ID:', company.id)
      console.log('Company Name:', company.name)
      console.log('Company:', JSON.stringify(company, null, 2))
    }

    // Get auth user
    const { data: authData } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authData.users.find((u) => u.email === testEmail)

    console.log('\n=== AUTH USER ===')
    console.log('Email Confirmed At:', authUser?.email_confirmed_at)
    console.log('Confirmed:', authUser?.email_confirmed_at ? 'YES' : 'NO')
    console.log('Last Sign In:', authUser?.last_sign_in_at)
    console.log('Created At:', authUser?.created_at)

    // Cleanup
    await deleteTestUser(testEmail)
  })
})
