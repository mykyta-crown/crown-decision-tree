import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Créer une company de test
 */
export async function createTestCompany(name: string) {
  const { data, error } = await supabaseAdmin
    .from('companies')
    .insert({
      name,
      phone: '+33123456789',
      address: '123 Test Street',
      country: 'France',
      legal_id: '12345678900000' // SIRET number format
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create test company: ${error.message}`)
  }

  return data
}

/**
 * Créer un utilisateur de test avec email auto-confirmé
 * (Bypass de l'email verification via Admin API)
 */
export async function createTestUser(
  email: string,
  password: string,
  options?: {
    createCompany?: boolean
    admin?: boolean
    firstName?: string
    lastName?: string
    phone?: string
    position?: string
  }
) {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true // ← CLEF: Bypass email verification
  })

  if (error) {
    throw new Error(`Failed to create test user: ${error.message}`)
  }

  // Le trigger DB ne crée pas toujours le profile automatiquement
  // On le crée manuellement pour être sûr
  const userId = data.user.id

  // Créer le profile manuellement avec données complètes
  const { error: profileError } = await supabaseAdmin.from('profiles').insert({
    id: userId,
    email: email,
    is_active: true,
    is_deleted: false,
    first_name: options?.firstName || 'Test',
    last_name: options?.lastName || 'User',
    phone: options?.phone || '+33612345678',
    position: options?.position || 'Test Position'
  })

  if (profileError) {
    // Si le profile existe déjà, c'est ok (le trigger a fonctionné)
    if (!profileError.message?.includes('duplicate') && !profileError.code?.includes('23505')) {
      throw new Error(`Failed to create profile: ${profileError.message}`)
    }
  }

  // Attendre un peu que tout soit en place
  await new Promise((resolve) => setTimeout(resolve, 500))

  // Create company and link to profile if requested
  if (options?.createCompany) {
    const companyName = `Test Company - ${email.split('@')[0]}`
    const company = await createTestCompany(companyName)

    // Update profile with company_id and set as buyer (admin is also a buyer)
    const { error: updateError } = await supabaseAdmin
      .from('profiles')
      .update({
        company_id: company.id,
        role: 'buyer',
        admin: options?.admin !== false // Default to true if createCompany is true
      })
      .eq('email', email)

    if (updateError) {
      throw new Error(`Failed to link company to user: ${updateError.message}`)
    }
  }

  return data.user
}

/**
 * Supprimer un utilisateur de test et ses données associées
 */
export async function deleteTestUser(email: string): Promise<void> {
  // Récupérer l'ID user et company_id depuis profiles
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('id, company_id')
    .eq('email', email)
    .maybeSingle()

  if (!profile) {
    return // User n'existe pas
  }

  // Supprimer la company si elle existe et commence par "Test Company"
  if (profile.company_id) {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('name')
      .eq('id', profile.company_id)
      .maybeSingle()

    if (company?.name?.startsWith('Test Company')) {
      await supabaseAdmin.from('companies').delete().eq('id', profile.company_id)
    }
  }

  // Supprimer via Admin API (cascade sur profiles via trigger)
  const { error } = await supabaseAdmin.auth.admin.deleteUser(profile.id)

  if (error) {
    console.error(`Failed to delete test user ${email}:`, error)
  }
}

/**
 * Récupérer un utilisateur depuis auth.users par email
 */
export async function getAuthUser(email: string) {
  const { data, error } = await supabaseAdmin.auth.admin.listUsers()

  if (error) {
    throw new Error(`Failed to list users: ${error.message}`)
  }

  return data.users.find((user) => user.email === email) || null
}

/**
 * Récupérer le profil d'un utilisateur
 */
export async function getUserProfile(email: string) {
  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('*')
    .eq('email', email)
    .maybeSingle()

  if (error) {
    throw new Error(`Failed to get user profile: ${error.message}`)
  }

  return data
}

/**
 * Mettre à jour le onboarding_step d'un utilisateur
 * (Utile pour tester les redirections)
 */
export async function setOnboardingStep(email: string, step: number) {
  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ onboarding_step: step })
    .eq('email', email)

  if (error) {
    throw new Error(`Failed to update onboarding_step: ${error.message}`)
  }
}
