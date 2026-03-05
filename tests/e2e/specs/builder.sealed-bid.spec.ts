/**
 * E2E Tests - Sealed Bid Auction Builder
 */

import { test, expect } from '@playwright/test'
import { BuilderPage } from '../pages/builder.page'
import { BasicsStepPage } from '../pages/builder/basics-step.page'
import { SuppliersStepPage } from '../pages/builder/suppliers-step.page'
import { LotsStepPage } from '../pages/builder/lots-step.page'
import { SealedBidLotFormPage } from '../pages/builder/sealed-bid-lot-form.page'
import { SigninPage } from '../pages/signin.page'
import { createTestUser, deleteTestUser, setOnboardingStep } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'
import { generateTestAuctionData } from '../helpers/builder-helpers'
import { deleteAuction, verifyAuctionCreated } from '../helpers/auction-helpers'

test.describe('Builder - Sealed Bid Auction', () => {
  let testEmail: string
  let auctionId: string
  let signinPage: SigninPage
  let builderPage: BuilderPage
  let basicsPage: BasicsStepPage
  let suppliersPage: SuppliersStepPage
  let lotsPage: LotsStepPage
  let sealedBidForm: SealedBidLotFormPage

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail()
    await createTestUser(testEmail, VALID_TEST_PASSWORD, { createCompany: true })
    await setOnboardingStep(testEmail, 4)

    signinPage = new SigninPage(page)
    builderPage = new BuilderPage(page)
    basicsPage = new BasicsStepPage(page)
    suppliersPage = new SuppliersStepPage(page)
    lotsPage = new LotsStepPage(page)
    sealedBidForm = new SealedBidLotFormPage(page)

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

  test('should create Sealed Bid auction successfully', async () => {
    const testData = generateTestAuctionData('sealed-bid')

    // ===== STEP 1: Basics =====
    await builderPage.expandBasicsStep()
    await basicsPage.fillBasicInfo({
      name: testData.basics.name,
      type: 'sealed-bid'
    })

    // ===== STEP 2: Suppliers =====
    await builderPage.expandSuppliersStep()
    for (const supplier of testData.suppliers) {
      await suppliersPage.addNewSupplier(supplier.email, supplier.phone)
    }

    // ===== STEP 3: Lots =====
    await builderPage.expandLotsStep()

    const lot = testData.lots[0]

    await sealedBidForm.fillCompleteLot({
      name: lot.name,
      baseline: lot.baseline,
      suppliers: testData.suppliers.map((s) => s.email),
      items: lot.items,
      awardingPrinciples: 'Lowest bid wins',
      commercialTerms: 'Single blind bidding - no visibility of other bids',
      generalTerms: 'Sealed bid auction rules apply'
    })

    // ===== SUBMIT =====
    await builderPage.waitForSubmitEnabled()
    const result = await builderPage.submit()
    auctionId = result.auctionId

    // ===== VERIFY =====
    await expect(builderPage.page).toHaveURL(/\/auctions\/.*\/lots\/.*\/buyer/)

    // Verify auction in database
    const auction = await verifyAuctionCreated(auctionId, {
      type: 'sealed-bid',
      name: testData.basics.name,
      baseline: lot.baseline,
      supplierCount: 2,
      itemCount: 1
    })

    // Verify Sealed Bid specifics: duration = 0, overtime = 0
    expect(auction.duration).toBe(0)
    expect(auction.overtime_range).toBe(0)
    expect(auction.min_bid_decr).toBe(0)

    // Wait on the auction page so we can inspect it
    await builderPage.page.waitForTimeout(5000)
  })
})
