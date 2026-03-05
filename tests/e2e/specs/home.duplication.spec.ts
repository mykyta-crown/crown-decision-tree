/**
 * E2E Tests - Home Page Auction Duplication
 * Uses seeders to create test data directly in the database
 */

import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { SigninPage } from '../pages/signin.page'
import { createTestUser, deleteTestUser, setOnboardingStep } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'
import {
  deleteAuctionGroup,
  verifyFlatDuplication,
  verifyTrainingDuplication,
  getGroupIdsForAuctions
} from '../helpers/auction-helpers'
import { seedSimpleAuction, seedMultiSupplierAuction, getUserProfile } from '../helpers/seeders'

test.describe('Home - Auction Duplication', () => {
  let testEmail: string
  let sourceGroupId: string
  let duplicatedGroupIds: string[] = []

  let signinPage: SigninPage
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail()

    // Create admin user (required to see duplicate button)
    await createTestUser(testEmail, VALID_TEST_PASSWORD, {
      createCompany: true,
      admin: true
    })
    await setOnboardingStep(testEmail, 4)

    // Initialize page objects
    signinPage = new SigninPage(page)
    homePage = new HomePage(page)

    // Login
    await signinPage.goto()
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Accept cookies if banner is present
    const cookieBanner = page.locator('button').filter({ hasText: /accept|agree|compris|ok/i })
    if (await cookieBanner.isVisible({ timeout: 2000 }).catch(() => false)) {
      await cookieBanner.first().click({ force: true })
      await page.waitForTimeout(500)
    }
  })

  test.afterEach(async () => {
    // Cleanup source auction
    if (sourceGroupId) {
      await deleteAuctionGroup(sourceGroupId)
    }

    // Cleanup duplicated auctions
    for (const groupId of duplicatedGroupIds) {
      await deleteAuctionGroup(groupId)
    }

    duplicatedGroupIds = []

    await deleteTestUser(testEmail)
  })

  test('should duplicate auction in flat mode', async ({ page }) => {
    const timestamp = Date.now()
    const auctionName = `Test Auction Flat ${timestamp}`

    // Seed a simple auction
    const profile = await getUserProfile(testEmail)
    const { groupId, auctionId } = await seedSimpleAuction(profile, {
      name: auctionName,
      lotName: auctionName, // This is what appears in the home table
      supplierEmails: ['supplier1@test.com']
    })

    sourceGroupId = groupId

    // Navigate to home and reload to ensure seeded data appears
    await homePage.goto()
    await page.reload({ waitUntil: 'networkidle' })

    // Verify auction is visible
    await homePage.expectAuctionVisible(auctionName)

    // Open duplicate dialog
    await homePage.openDuplicateDialog(auctionName)

    // Flat should be pre-selected
    await expect(homePage.flatRadio).toBeChecked()

    // Confirm duplication
    await homePage.confirmDuplication()

    // Verify success toast
    await homePage.waitForSuccessToast(1)

    // Verify datatable refresh
    await homePage.waitForDatatableRefresh()

    // Verify the copy appears in the list
    await homePage.expectAuctionVisible('Copy of ' + auctionName)

    // Wait a bit for database to commit
    await page.waitForTimeout(2000)

    // Verify in database
    const duplicated = await verifyFlatDuplication(auctionId, 'Copy of ' + auctionName)

    duplicatedGroupIds.push(duplicated.auctions_group_settings_id)
  })

  test('should duplicate auction in training mode with multiple suppliers', async ({ page }) => {
    const timestamp = Date.now()
    const auctionName = `Multi-Supplier Training ${timestamp}`
    const supplierCount = 3

    // Seed a multi-supplier auction
    const profile = await getUserProfile(testEmail)
    const { groupId, auctionId } = await seedMultiSupplierAuction(profile, {
      name: auctionName,
      lotName: auctionName,
      supplierCount
    })

    sourceGroupId = groupId

    // Navigate to home and wait for auction to appear
    await homePage.goto()
    await page.waitForTimeout(3000)

    // Verify auction is visible
    await homePage.expectAuctionVisible(auctionName)

    // Open duplicate dialog
    await homePage.openDuplicateDialog(auctionName)

    // Select training mode
    await homePage.selectDuplicationType('training')
    await expect(homePage.trainingRadio).toBeChecked()

    // Confirm duplication
    await homePage.confirmDuplication()

    // Toast should show the number of suppliers
    await homePage.waitForSuccessToast(supplierCount)

    // Verify datatable refresh
    await homePage.waitForDatatableRefresh()

    // Verify in database (should create one auction per supplier)
    const trainingAuctions = await verifyTrainingDuplication(auctionId, supplierCount)

    // Collect group IDs for cleanup
    const groupIds = await getGroupIdsForAuctions(`%${auctionName}%Training%`)
    duplicatedGroupIds.push(...groupIds)
  })

  test('should cancel duplication when clicking cancel button', async ({ page }) => {
    const timestamp = Date.now()
    const auctionName = `Test Auction Cancel ${timestamp}`

    // Seed a simple auction
    const profile = await getUserProfile(testEmail)
    const { groupId } = await seedSimpleAuction(profile, {
      name: auctionName,
      lotName: auctionName
    })

    sourceGroupId = groupId

    // Navigate to home and reload to ensure seeded data appears
    await homePage.goto()
    await page.reload({ waitUntil: 'networkidle' })

    // Verify auction is visible
    await homePage.expectAuctionVisible(auctionName)

    // Open duplicate dialog
    await homePage.openDuplicateDialog(auctionName)

    // Click cancel
    await homePage.dialogCancelButton.click()

    // Dialog should close
    await homePage.expectDialogHidden()

    // Wait a bit to ensure no duplication occurred
    await page.waitForTimeout(2000)

    // No copy should be created
    const hasCopy = await homePage.hasAuction('Copy of ' + auctionName)
    expect(hasCopy).toBe(false)
  })

  test('should handle single supplier in training mode', async ({ page }) => {
    const timestamp = Date.now()
    const auctionName = `Single Supplier Training ${timestamp}`

    // Seed a single-supplier auction
    const profile = await getUserProfile(testEmail)
    const { groupId, auctionId } = await seedSimpleAuction(profile, {
      name: auctionName,
      lotName: auctionName,
      supplierEmails: ['supplier1@test.com']
    })

    sourceGroupId = groupId

    // Navigate to home and reload to ensure seeded data appears
    await homePage.goto()
    await page.reload({ waitUntil: 'networkidle' })

    // Verify auction is visible
    await homePage.expectAuctionVisible(auctionName)

    // Open duplicate dialog
    await homePage.openDuplicateDialog(auctionName)

    // Select training mode
    await homePage.selectDuplicationType('training')

    // Confirm duplication
    await homePage.confirmDuplication()

    // Toast should show 1 auction created
    await homePage.waitForSuccessToast(1)

    // Verify datatable refresh
    await homePage.waitForDatatableRefresh()

    // Verify in database
    const trainingAuctions = await verifyTrainingDuplication(auctionId, 1)

    // Collect group IDs for cleanup
    const groupIds = await getGroupIdsForAuctions(`%${auctionName}%Training%`)
    duplicatedGroupIds.push(...groupIds)
  })
})
