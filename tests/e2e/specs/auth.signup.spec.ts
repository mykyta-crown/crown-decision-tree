import { test, expect } from '@playwright/test'
import { SignupPage } from '../pages/signup.page'
import { SigninPage } from '../pages/signin.page'
import { deleteTestUser, getAuthUser, supabaseAdmin } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'

test.describe('Authentication - Sign Up', () => {
  let testEmail: string
  let signupPage: SignupPage

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail()
    signupPage = new SignupPage(page)
    await signupPage.goto()
  })

  test.afterEach(async () => {
    await deleteTestUser(testEmail)
  })

  test('should successfully create new account', async ({ page }) => {
    // Action: Remplir le formulaire
    await signupPage.fillRegistrationForm(testEmail, VALID_TEST_PASSWORD, VALID_TEST_PASSWORD)
    await signupPage.acceptTerms()
    await signupPage.submit()

    // Assert: Dialog de confirmation email s'affiche (wait for API response then dialog)
    await page.waitForLoadState('networkidle')
    const dialog = page.locator('.v-dialog').filter({ hasText: /.+/ })
    await expect(dialog).toBeVisible({ timeout: 15000 })
    await expect(dialog).toContainText(/email/i)

    // Vérifier que le user existe en DB (non confirmé initialement)
    const user = await getAuthUser(testEmail)
    expect(user).toBeTruthy()
    expect(user?.email).toBe(testEmail)
  })

  test('should login after admin confirms email', async ({ page }) => {
    // Action: Créer compte
    await signupPage.fillRegistrationForm(testEmail, VALID_TEST_PASSWORD, VALID_TEST_PASSWORD)
    await signupPage.acceptTerms()
    await signupPage.submit()

    // Wait for success dialog (wait for network then dialog)
    await page.waitForLoadState('networkidle')
    const dialog = page.locator('.v-dialog').filter({ hasText: /.+/ })
    await expect(dialog).toBeVisible({ timeout: 15000 })

    // Simulate admin confirming email
    const user = await getAuthUser(testEmail)
    if (!user) throw new Error('User not found after signup')
    await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirm: true
    })

    // Navigate to signin (navigate away to close dialog)
    await page.goto('/auth/signin')
    const signinPage = new SigninPage(page)
    await expect(signinPage.emailInput).toBeVisible()

    // Login should work now
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)
    await expect(page).toHaveURL(/\/onboarding|\/dashboard/, { timeout: 10000 })
  })

  test('should show error for invalid email format', async () => {
    // Action: Email invalide
    await signupPage.emailInput.fill('invalid-email')
    await signupPage.emailInput.blur() // Trigger Vuetify validation

    // Assert: Message d'erreur de validation visible
    const errorMessage = signupPage.page.locator('[id*="-messages"]').filter({ hasText: /.+/ })
    await expect(errorMessage).toBeVisible()
  })

  test('should show password requirements tooltip', async ({ page }) => {
    // Action: Focus sur password input
    await signupPage.passwordInput.focus()

    // Assert: Tooltip visible avec requirements
    const tooltip = page.locator('.v-tooltip')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText(/8.*character/i)
    await expect(tooltip).toContainText(/upper.*lower|case.*letter/i)
    await expect(tooltip).toContainText(/number/i)
    await expect(tooltip).toContainText(/special/i)
  })

  test('should validate password strength requirements', async () => {
    // Test avec un seul weak password pour vérifier la validation
    const weakPassword = 'short' // Trop court

    await signupPage.emailInput.fill(testEmail)
    await signupPage.passwordInput.fill(weakPassword)
    await signupPage.passwordInput.blur() // Trigger validation
    await signupPage.confirmPasswordInput.fill(weakPassword)
    await signupPage.acceptTerms()

    // Assert: Message d'erreur de validation visible
    const errorMessage = signupPage.page.locator('[id*="-messages"]').filter({ hasText: /.+/ })
    await expect(errorMessage).toBeVisible()

    // Assert: Le form ne devrait pas se soumettre
    await signupPage.submitButton.click()
    await expect(signupPage.page).toHaveURL(/\/auth\/signup/)
  })

  test('should show error when passwords do not match', async () => {
    // Action: Mots de passe différents
    await signupPage.emailInput.fill(testEmail)
    await signupPage.passwordInput.fill(VALID_TEST_PASSWORD)
    await signupPage.confirmPasswordInput.fill('DifferentPassword123!')
    await signupPage.confirmPasswordInput.blur() // Trigger validation

    // Assert: Message d'erreur de validation visible
    const errorMessage = signupPage.page.locator('[id*="-messages"]').filter({ hasText: /.+/ })
    await expect(errorMessage).toBeVisible()
  })

  test('should require terms acceptance', async () => {
    // Action: Remplir form sans accepter terms
    await signupPage.fillRegistrationForm(testEmail, VALID_TEST_PASSWORD, VALID_TEST_PASSWORD)
    // NE PAS accepter les terms

    // Assert: Bouton disabled
    await expect(signupPage.submitButton).toBeDisabled()

    // Action: Accepter terms
    await signupPage.acceptTerms()

    // Assert: Bouton enabled
    await expect(signupPage.submitButton).toBeEnabled()
  })

  test('should navigate to signin page', async ({ page }) => {
    // Action: Cliquer sur "Déjà un compte"
    await signupPage.signinButton.click()

    // Assert: Navigation
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should show error for duplicate email', async () => {
    // Setup: Créer user d'abord
    await deleteTestUser(testEmail) // Ensure clean
    await signupPage.fillRegistrationForm(testEmail, VALID_TEST_PASSWORD, VALID_TEST_PASSWORD)
    await signupPage.acceptTerms()
    await signupPage.submit()

    // Wait for dialog (wait for network idle first)
    await signupPage.page.waitForLoadState('networkidle')
    const dialog = signupPage.page.locator('.v-dialog').filter({ hasText: /.+/ })
    await expect(dialog).toBeVisible({ timeout: 15000 })

    // Action: Navigate away to close dialog, then go back to signup
    await signupPage.page.goto('/auth/signup')
    await signupPage.page.waitForLoadState('load')
    await expect(signupPage.emailInput).toBeVisible()

    await signupPage.fillRegistrationForm(testEmail, VALID_TEST_PASSWORD, VALID_TEST_PASSWORD)
    await signupPage.acceptTerms()
    await signupPage.submit()

    // Assert: Erreur (email déjà utilisé) - wait for network response
    await signupPage.page.waitForLoadState('networkidle')
    const errorAlert = signupPage.page.locator('[role="alert"]').filter({ hasText: /.+/ })
    await expect(errorAlert).toBeVisible({ timeout: 10000 })
  })
})
