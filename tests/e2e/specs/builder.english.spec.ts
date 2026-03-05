/**
 * E2E Tests - English (Reverse) Auction Builder
 */

import { test, expect } from '@playwright/test'
import { BuilderPage } from '../pages/builder.page'
import { BasicsStepPage } from '../pages/builder/basics-step.page'
import { SuppliersStepPage } from '../pages/builder/suppliers-step.page'
import { LotsStepPage } from '../pages/builder/lots-step.page'
import { EnglishLotFormPage } from '../pages/builder/english-lot-form.page'
import { SigninPage } from '../pages/signin.page'
import { createTestUser, deleteTestUser, setOnboardingStep } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'
import { generateTestAuctionData } from '../helpers/builder-helpers'
import { deleteAuction, verifyAuctionCreated } from '../helpers/auction-helpers'

test.describe('Builder - English (Reverse) Auction', () => {
  let testEmail: string
  let auctionId: string
  let signinPage: SigninPage
  let builderPage: BuilderPage
  let basicsPage: BasicsStepPage
  let suppliersPage: SuppliersStepPage
  let lotsPage: LotsStepPage
  let englishForm: EnglishLotFormPage

  test.beforeEach(async ({ page }) => {
    // Create test user with company and set onboarding complete
    testEmail = generateTestEmail()
    await createTestUser(testEmail, VALID_TEST_PASSWORD, { createCompany: true })
    await setOnboardingStep(testEmail, 4)

    // Initialize page objects
    signinPage = new SigninPage(page)
    builderPage = new BuilderPage(page)
    basicsPage = new BasicsStepPage(page)
    suppliersPage = new SuppliersStepPage(page)
    lotsPage = new LotsStepPage(page)
    englishForm = new EnglishLotFormPage(page)

    // Login first
    await signinPage.goto()
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)

    // Wait for redirect after login (can be /home, /onboarding, /builder, or /dashboard)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for any redirects to complete

    // Accept cookies if banner is present
    const cookieBanner = page.locator('button').filter({ hasText: /accept|agree|compris|ok/i })
    if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBanner.first().click({ force: true }) // Force click to bypass Intercom overlay
      await page.waitForTimeout(500)
    }

    // Navigate to builder
    await builderPage.goto()
  })

  test.afterEach(async () => {
    // Cleanup
    if (auctionId) {
      await deleteAuction(auctionId)
    }
    await deleteTestUser(testEmail)
  })

  test('should create English auction successfully', async () => {
    // Generate test data
    const testData = generateTestAuctionData('reverse')

    // ===== STEP 1: Basics =====
    await builderPage.expandBasicsStep()

    await basicsPage.fillBasicInfo({
      name: testData.basics.name,
      type: 'reverse',
      description: testData.basics.description
    })

    // ===== STEP 2: Suppliers =====
    await builderPage.expandSuppliersStep()

    // Add suppliers
    for (const supplier of testData.suppliers) {
      await suppliersPage.addNewSupplier(supplier.email, supplier.phone)
    }

    // ===== STEP 3: Lots =====
    await builderPage.expandLotsStep()

    const lot = testData.lots[0]

    // Fill lot form
    await englishForm.fillCompleteLot({
      name: lot.name,
      baseline: lot.baseline,
      minBidDecr: lot.min_bid_decr!,
      maxBidDecr: lot.max_bid_decr!,
      duration: lot.duration!,
      overtime: lot.overtime_range!,
      suppliers: testData.suppliers.map((s) => s.email),
      items: lot.items,
      awardingPrinciples: 'Lowest price wins',
      commercialTerms: 'Payment within 30 days',
      generalTerms: 'Standard terms and conditions apply'
    })

    // Collapse Lots step to trigger validation
    const lotsPanel = builderPage.page.locator('.v-expansion-panel').nth(2)
    await lotsPanel.locator('.v-expansion-panel-title').click()
    await builderPage.page.waitForTimeout(2000) // Wait longer for validation

    // ===== SUBMIT =====
    // Wait for submit button to enable (validation is complete when button enables)
    await builderPage.waitForSubmitEnabled(30000)

    const result = await builderPage.submit()
    auctionId = result.auctionId

    // ===== VERIFY =====
    await expect(builderPage.page).toHaveURL(/\/auctions\/.*\/lots\/.*\/buyer/, { timeout: 30000 })

    // Verify auction in database
    await verifyAuctionCreated(auctionId, {
      type: 'reverse',
      name: testData.basics.name,
      baseline: lot.baseline,
      supplierCount: 2,
      itemCount: 1
    })

    // Wait on the auction page so we can inspect it
    await builderPage.page.waitForTimeout(5000)
  })

  test('should validate required fields', async () => {
    // Expand all steps
    await builderPage.expandBasicsStep()
    await builderPage.expandSuppliersStep()
    await builderPage.expandLotsStep()

    // Submit button should be disabled with empty form
    await expect(builderPage.submitButton).toBeDisabled()

    // Fill only basics
    await builderPage.expandBasicsStep()
    await basicsPage.fillBasicInfo({
      name: 'Test Auction',
      type: 'reverse'
    })

    // Still disabled (need suppliers)
    await expect(builderPage.submitButton).toBeDisabled()

    // Add supplier
    await builderPage.expandSuppliersStep()
    await suppliersPage.addNewSupplier('supplier+test@crown.ovh', '+33612345678')

    // Still disabled (need lot details)
    await expect(builderPage.submitButton).toBeDisabled()

    // Fill minimum lot details
    await builderPage.expandLotsStep()
    await englishForm.fillLotName('Lot 1')
    await englishForm.fillBaseline(1000)
    await englishForm.fillMinBidDecrement(10)
    await englishForm.fillMaxBidDecrement(100)
    await englishForm.fillDuration(15)
    await englishForm.selectOvertime(1)

    await englishForm.selectSuppliers(['supplier+test@crown.ovh'])

    await englishForm.addLineItem(
      {
        name: 'Test Item',
        unit: 'piece',
        quantity: 10,
        prices: {
          'supplier+test@crown.ovh': 100
        }
      },
      0
    )

    await englishForm.fillAwardingPrinciples('Test principles')
    await englishForm.fillCommercialTerms('Test commercial terms')
    await englishForm.fillGeneralTerms('Test general terms')

    // Wait for form validation
    await builderPage.page.waitForTimeout(1000)

    // Collapse Lots step to trigger validation
    const lotsPanel = builderPage.page.locator('.v-expansion-panel').nth(2)
    await lotsPanel.locator('.v-expansion-panel-title').click()
    await builderPage.page.waitForTimeout(1000)

    // Now submit should be enabled
    await builderPage.waitForSubmitEnabled(15000)
    await expect(builderPage.submitButton).toBeEnabled()
  })
})
