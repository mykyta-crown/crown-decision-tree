/**
 * Debug test to investigate navigation issues
 */

import { test } from '@playwright/test'
import { SigninPage } from '../pages/signin.page'
import { createTestUser, deleteTestUser, setOnboardingStep } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'

test.describe('Builder Navigation Debug', () => {
  let testEmail: string

  test.beforeEach(async () => {
    testEmail = generateTestEmail()
    await createTestUser(testEmail, VALID_TEST_PASSWORD, { createCompany: true })
    await setOnboardingStep(testEmail, 4)
  })

  test.afterEach(async () => {
    await deleteTestUser(testEmail)
  })

  test('should debug navigation flow', async ({ page }) => {
    const signinPage = new SigninPage(page)

    console.log('\n=== STEP 1: Initial URL ===')
    console.log('URL:', page.url())

    console.log('\n=== STEP 2: Navigate to signin ===')
    await signinPage.goto()
    console.log('URL after goto signin:', page.url())

    console.log('\n=== STEP 3: Login ===')
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)
    console.log('URL after login:', page.url())

    console.log('\n=== STEP 4: Navigate to builder ===')
    console.log('Attempting to navigate to /builder...')
    const response = await page.goto('/builder', { waitUntil: 'networkidle' })
    console.log('Response status:', response?.status())
    console.log('Response URL:', response?.url())
    console.log('Current URL after goto:', page.url())

    await page.waitForTimeout(2000)
    console.log('Final URL after wait:', page.url())

    console.log('\n=== STEP 5: Check page content ===')
    const title = await page.title()
    console.log('Page title:', title)

    const hasExpansionPanel = await page.locator('.v-expansion-panel').count()
    console.log('Expansion panels found:', hasExpansionPanel)

    const hasLandingContent = await page.locator('text=Reach True Market Value').count()
    console.log('Landing page content found:', hasLandingContent)

    // Take screenshot
    await page.screenshot({ path: 'test-results/builder-debug-nav.png', fullPage: true })
  })
})
