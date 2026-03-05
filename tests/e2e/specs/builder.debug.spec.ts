/**
 * Test de debug pour identifier le problème avec le builder
 */

import { test, expect } from '@playwright/test'
import { SigninPage } from '../pages/signin.page'
import { createTestUser, deleteTestUser, setOnboardingStep } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'

test.describe('Builder - Debug', () => {
  let testEmail: string

  test.beforeEach(async ({ page }) => {
    // Create admin user with company
    testEmail = generateTestEmail()
    await createTestUser(testEmail, VALID_TEST_PASSWORD, { createCompany: true })
    await setOnboardingStep(testEmail, 4)

    // Login
    const signinPage = new SigninPage(page)
    await signinPage.goto()
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(1000)
  })

  test.afterEach(async () => {
    await deleteTestUser(testEmail)
  })

  test('debug - check owner field in builder', async ({ page }) => {
    // Navigate to builder
    await page.goto('/builder')
    await page.waitForLoadState('domcontentloaded')
    await expect(page.locator('.v-expansion-panel').first()).toBeVisible({ timeout: 15000 })

    // Expand Basics step
    const basicsPanel = page.locator('.v-expansion-panel').nth(0)
    const basicsContent = basicsPanel.locator('.v-expansion-panel-text')

    if (!(await basicsContent.isVisible())) {
      await basicsPanel.locator('.v-expansion-panel-title').click()
      await page.waitForTimeout(500)
      await expect(basicsContent).toBeVisible()
    }

    // Wait a bit for all fields to load
    await page.waitForTimeout(1000)

    // Log all v-select and v-autocomplete elements
    const selects = await page.locator('.v-select, .v-autocomplete').all()
    console.log(`Found ${selects.length} select/autocomplete elements`)

    for (let i = 0; i < selects.length; i++) {
      const text = await selects[i].textContent()
      console.log(`Select ${i}: ${text}`)
    }

    // Try to find owner field
    const ownerSelect = page.locator('.v-autocomplete, .v-select').filter({ hasText: /owner/i })
    const ownerExists = await ownerSelect.count()
    console.log(`Owner field exists: ${ownerExists > 0}`)

    if (ownerExists > 0) {
      // Click to open dropdown
      await ownerSelect.click()
      await page.waitForTimeout(500)

      // Check options
      const options = page.locator('.v-list-item')
      const optionCount = await options.count()
      console.log(`Owner options count: ${optionCount}`)

      for (let i = 0; i < Math.min(optionCount, 5); i++) {
        const optionText = await options.nth(i).textContent()
        console.log(`Option ${i}: ${optionText}`)
      }
    }

    // Pause to inspect manually
    await page.pause()
  })
})
