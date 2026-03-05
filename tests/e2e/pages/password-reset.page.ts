import { Page, expect } from '@playwright/test'

export class PasswordResetPage {
  constructor(private page: Page) {}

  // Locators
  get emailInput() {
    // v-text-field - only text input in the form (no placeholder, has label)
    return this.page.locator('input[type="text"]').first()
  }

  get submitButton() {
    // v-btn-primary with type submit
    return this.page.locator('button[type="submit"]')
  }

  get successSnackbar() {
    // v-snackbar that appears after submit
    return this.page.locator('.v-snackbar').filter({ hasText: /.+/ })
  }

  get backToLoginButton() {
    // v-btn linking to /auth/signin
    return this.page.locator('a[href="/auth/signin"]')
  }

  // Actions
  async goto() {
    await this.page.goto('/auth/ask-password-change')
    await expect(this.emailInput).toBeVisible()
  }

  async requestPasswordReset(email: string) {
    await this.emailInput.fill(email)
    await this.submitButton.click()
  }

  // Assertions
  async expectSuccessMessage() {
    await expect(this.successSnackbar).toBeVisible({ timeout: 10000 })
  }
}
