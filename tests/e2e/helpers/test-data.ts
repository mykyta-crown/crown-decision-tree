/**
 * Générer un email de test unique
 */
export function generateTestEmail(): string {
  const timestamp = Date.now()
  const random = Math.floor(Math.random() * 1000)
  return `e2e-test-${timestamp}-${random}@gmail.com`
}

/**
 * Mot de passe valide pour les tests
 * Répond aux critères: 8+ chars, minuscule, majuscule, chiffre, caractère spécial
 */
export const VALID_TEST_PASSWORD = 'TestPass123!@#'

/**
 * Credentials de test prédéfinis (optionnel)
 */
export const TEST_USERS = {
  admin: {
    email: 'victor@crown-procurement.com',
    password: 'Bestfriends75/!!'
  },
  supplier: {
    email: 'supplier+1@crown.ovh',
    password: 'Supplier+1@crown.ovh'
  }
}
