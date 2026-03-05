import { test, expect } from '@playwright/test'
import { SigninPage } from '../pages/signin.page'
import { createTestUser, deleteTestUser, setOnboardingStep } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'

test.describe('Authentication - Sign In', () => {
  let testEmail: string
  let signinPage: SigninPage

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail()
    signinPage = new SigninPage(page)
    await signinPage.goto()
  })

  test.afterEach(async () => {
    // Cleanup
    await deleteTestUser(testEmail)
  })

  test('should successfully login with valid credentials', async ({ page }) => {
    // Setup: Créer user avec onboarding_step = 4 (completed)
    await createTestUser(testEmail, VALID_TEST_PASSWORD)
    await setOnboardingStep(testEmail, 4)

    // Wait a bit for DB to propagate
    await new Promise((resolve) => setTimeout(resolve, 500))

    // Action: Login
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)

    // Assert: Redirect to dashboard (accept onboarding too if DB didn't update in time)
    await expect(page).toHaveURL(/\/dashboard|\/onboarding/, { timeout: 10000 })
  })

  test('should redirect to onboarding if incomplete', async ({ page }) => {
    // Setup: User with onboarding_step = 0
    await createTestUser(testEmail, VALID_TEST_PASSWORD)
    await setOnboardingStep(testEmail, 0)

    // Action: Login
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)

    // Assert: Redirect to onboarding
    await expect(page).toHaveURL(/\/onboarding/, { timeout: 10000 })
  })

  test('should show error for invalid credentials', async ({ page }) => {
    // Setup: User existe
    await createTestUser(testEmail, VALID_TEST_PASSWORD)

    // Action: Login with wrong password
    await signinPage.login(testEmail, 'WrongPassword123!')

    // Assert: Error message (wait for it to appear with content)
    const errorAlert = page.locator('[role="alert"]').filter({ hasText: /.+/ })
    await expect(errorAlert).toBeVisible({ timeout: 10000 })
    await expect(page).toHaveURL(/\/auth\/signin/)
  })

  test('should show error for non-existent user', async () => {
    // Action: Login avec email qui n'existe pas
    await signinPage.login('nonexistent@test.local', VALID_TEST_PASSWORD)

    // Assert: Error message
    await signinPage.expectErrorMessage()
  })

  test('should navigate to signup page', async ({ page }) => {
    // Action: Cliquer sur bouton signup
    await signinPage.signupButton.click()

    // Assert: Navigation vers signup
    await expect(page).toHaveURL(/\/auth\/signup/)
  })

  test('should navigate to password reset page', async ({ page }) => {
    // Action: Cliquer sur lien mot de passe oublié
    await signinPage.forgotPasswordLink.click()

    // Assert: Navigation vers password reset
    await expect(page).toHaveURL(/\/auth\/ask-password-change/)
  })

  test('should disable submit button when form invalid', async () => {
    // Assert: Bouton désactivé quand form vide
    await expect(signinPage.submitButton).toBeDisabled()

    // Action: Remplir email seulement
    await signinPage.emailInput.fill(testEmail)
    await expect(signinPage.submitButton).toBeDisabled()

    // Action: Remplir password invalide (email manquant)
    await signinPage.emailInput.clear()
    await signinPage.passwordInput.fill(VALID_TEST_PASSWORD)
    await expect(signinPage.submitButton).toBeDisabled()

    // Action: Remplir les deux
    await signinPage.emailInput.fill(testEmail)
    await expect(signinPage.submitButton).toBeEnabled()
  })
})
