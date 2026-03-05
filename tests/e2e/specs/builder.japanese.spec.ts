/**
 * E2E Tests - Japanese Auction Builder
 */

import { test, expect } from '@playwright/test'
import { BuilderPage } from '../pages/builder.page'
import { BasicsStepPage } from '../pages/builder/basics-step.page'
import { SuppliersStepPage } from '../pages/builder/suppliers-step.page'
import { LotsStepPage } from '../pages/builder/lots-step.page'
import { JapaneseLotFormPage } from '../pages/builder/japanese-lot-form.page'
import { SigninPage } from '../pages/signin.page'
import { createTestUser, deleteTestUser, setOnboardingStep } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'
import { generateTestAuctionData } from '../helpers/builder-helpers'
import { deleteAuction, verifyAuctionCreated } from '../helpers/auction-helpers'

test.describe('Builder - Japanese Auction', () => {
  let testEmail: string
  let auctionId: string
  let signinPage: SigninPage
  let builderPage: BuilderPage
  let basicsPage: BasicsStepPage
  let suppliersPage: SuppliersStepPage
  let lotsPage: LotsStepPage
  let japaneseForm: JapaneseLotFormPage

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail()
    await createTestUser(testEmail, VALID_TEST_PASSWORD, { createCompany: true })
    await setOnboardingStep(testEmail, 4)

    signinPage = new SigninPage(page)
    builderPage = new BuilderPage(page)
    basicsPage = new BasicsStepPage(page)
    suppliersPage = new SuppliersStepPage(page)
    lotsPage = new LotsStepPage(page)
    japaneseForm = new JapaneseLotFormPage(page)

    // Login first
    await signinPage.goto()
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)
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
    if (auctionId) {
      await deleteAuction(auctionId)
    }
    await deleteTestUser(testEmail)
  })

  test('should create Japanese auction successfully', async () => {
    const testData = generateTestAuctionData('japanese')

    // ===== STEP 1: Basics =====
    await builderPage.expandBasicsStep()
    await basicsPage.fillBasicInfo({
      name: testData.basics.name,
      type: 'japanese'
    })

    // ===== STEP 2: Suppliers =====
    await builderPage.expandSuppliersStep()
    for (const supplier of testData.suppliers) {
      await suppliersPage.addNewSupplier(supplier.email, supplier.phone)
    }

    // ===== STEP 3: Lots =====
    await builderPage.expandLotsStep()

    const lot = testData.lots[0]

    await japaneseForm.fillCompleteLot({
      name: lot.name,
      baseline: lot.baseline,
      roundDecrement: lot.min_bid_decr!,
      startingPrice: lot.max_bid_decr!,
      duration: lot.duration!,
      roundDuration: lot.overtime_range!,
      suppliers: testData.suppliers.map((s) => s.email),
      items: lot.items,
      awardingPrinciples: 'Last seller remaining wins',
      commercialTerms: 'Payment within 30 days',
      generalTerms: 'Japanese auction rules apply'
    })

    // ===== SUBMIT =====
    await builderPage.waitForSubmitEnabled()
    const result = await builderPage.submit()
    auctionId = result.auctionId

    // ===== VERIFY =====
    await expect(builderPage.page).toHaveURL(/\/auctions\/.*\/lots\/.*\/buyer/)

    // Verify auction in database
    await verifyAuctionCreated(auctionId, {
      type: 'japanese',
      name: testData.basics.name,
      baseline: lot.baseline,
      supplierCount: 2,
      itemCount: 1
    })

    // Wait on the auction page so we can inspect it
    await builderPage.page.waitForTimeout(5000)
  })
})
