import { test, expect } from '@playwright/test'
import { PasswordResetPage } from '../pages/password-reset.page'
import { createTestUser, deleteTestUser } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'

test.describe('Authentication - Password Reset', () => {
  let testEmail: string
  let resetPage: PasswordResetPage

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail()
    resetPage = new PasswordResetPage(page)
    await resetPage.goto()
  })

  test.afterEach(async () => {
    await deleteTestUser(testEmail)
  })

  test('should send reset email for existing user', async () => {
    // Setup: Créer user
    await createTestUser(testEmail, VALID_TEST_PASSWORD)

    // Action: Demander reset
    await resetPage.requestPasswordReset(testEmail)

    // Assert: Message de succès (wait for snackbar - it's absolutely positioned inside #component)
    // Wait for the form to finish submitting first
    await resetPage.page.waitForLoadState('networkidle')
    const snackbar = resetPage.page.locator('.v-snackbar').filter({ hasText: /.+/ })
    await expect(snackbar).toBeVisible({ timeout: 15000 })
  })

  test('should show success even for non-existent email', async () => {
    // Action: Email qui n'existe pas (security: ne pas révéler si user existe)
    await resetPage.requestPasswordReset('nonexistent@test.local')

    // Assert: Message de succès quand même (comportement Supabase)
    await resetPage.expectSuccessMessage()
  })

  test('should validate email format', async () => {
    // Action: Email invalide
    await resetPage.emailInput.fill('invalid-email')
    await resetPage.emailInput.blur() // Trigger Vuetify validation

    // Assert: Validation error (Vuetify shows error message in aria-describedby element)
    const errorMessage = resetPage.page.locator('[id*="-messages"]').filter({ hasText: /.+/ })
    await expect(errorMessage).toBeVisible()
  })

  test('should navigate back to signin', async ({ page }) => {
    // Action: Cliquer sur retour connexion
    await resetPage.backToLoginButton.click()

    // Assert: Navigation
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should not submit form when email invalid', async () => {
    // Action: Remplir email invalide et essayer de soumettre
    await resetPage.emailInput.fill('invalid-email')
    await resetPage.emailInput.blur()

    const initialUrl = resetPage.page.url()
    await resetPage.submitButton.click()

    // Assert: Le form ne se soumet pas (reste sur la même page)
    await expect(resetPage.page).toHaveURL(initialUrl)

    // Assert: Message d'erreur visible
    const errorMessage = resetPage.page.locator('[id*="-messages"]').filter({ hasText: /.+/ })
    await expect(errorMessage).toBeVisible()
  })
})
