import { Page, expect } from '@playwright/test'

export class SigninPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() {
    // v-text-field - first text input in the form
    return this.page.locator('input[type="text"]').first()
  }

  get passwordInput() {
    // v-text-field with password type
    return this.page.locator('input[type="password"]').first()
  }

  get submitButton() {
    // v-btn-primary with type submit
    return this.page.locator('button[type="submit"]')
  }

  get signupButton() {
    // v-btn-secondary linking to /auth/signup
    return this.page.locator('a[href="/auth/signup"]')
  }

  get forgotPasswordLink() {
    // v-btn linking to /auth/ask-password-change
    return this.page.locator('a[href="/auth/ask-password-change"]')
  }

  get errorAlert() {
    // AuthErrorAlert component
    return this.page.locator('[role="alert"]').first()
  }

  // Actions
  async goto() {
    await this.page.goto('/auth/signin')
    await expect(this.emailInput).toBeVisible()
  }

  async fillCredentials(email: string, password: string) {
    await this.emailInput.fill(email)
    await this.passwordInput.fill(password)
  }

  async submit() {
    await this.submitButton.click()
  }

  async login(email: string, password: string) {
    await this.fillCredentials(email, password)
    await this.submit()
  }

  // Assertions helpers
  async expectErrorMessage(message?: string | RegExp) {
    await expect(this.errorAlert).toBeVisible()
    if (message) {
      await expect(this.errorAlert).toContainText(message)
    }
  }
}
