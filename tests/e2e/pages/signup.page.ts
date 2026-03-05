import { Page, expect } from '@playwright/test'

export class SignupPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() {
    // v-text-field - first text input in the form
    return this.page.locator('input[type="text"]').first()
  }

  get passwordInput() {
    // v-text-field with id="password-input"
    return this.page.locator('#password-input')
  }

  get confirmPasswordInput() {
    // v-text-field - second password input (after #password-input)
    return this.page.locator('input[type="password"]').nth(1)
  }

  get termsCheckbox() {
    // v-checkbox input
    return this.page.locator('input[type="checkbox"]')
  }

  get submitButton() {
    // v-btn-primary with type submit
    return this.page.locator('button[type="submit"]')
  }

  get successDialog() {
    // v-dialog that appears after signup
    return this.page.locator('.v-dialog--active').or(this.page.locator('[role="dialog"]'))
  }

  get signinButton() {
    // v-btn-secondary linking to /auth/signin
    return this.page.locator('a[href="/auth/signin"]')
  }

  // Actions
  async goto() {
    await this.page.goto('/auth/signup')
    await expect(this.emailInput).toBeVisible()
  }

  async fillRegistrationForm(email: string, password: string, confirmPassword: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
    await this.confirmPasswordInput.fill(confirmPassword)
  }

  async acceptTerms() {
    // Vuetify checkbox - cliquer sur le label peut être plus fiable
    await this.termsCheckbox.check({ force: true })
  }

  async submit() {
    await this.submitButton.click()
  }

  // Assertions
  async expectSuccessDialog() {
    await expect(this.successDialog).toBeVisible({ timeout: 10000 })
    await expect(this.successDialog).toContainText(/email.*confirmation/i)
  }
}
