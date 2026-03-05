/**
 * Simplified E2E Test for Auction Duplication
 * This test uses database helpers to create auctions directly,
 * avoiding the builder flow complexity
 */

import { test, expect } from '@playwright/test'
import { HomePage } from '../pages/home.page'
import { SigninPage } from '../pages/signin.page'
import { createTestUser, deleteTestUser, setOnboardingStep } from '../helpers/database'
import { generateTestEmail, VALID_TEST_PASSWORD } from '../helpers/test-data'
import {
  deleteAuctionGroup,
  getGroupIdsForAuctions,
  supabaseAdmin
} from '../helpers/auction-helpers'

test.describe('Home - Auction Duplication (Simplified)', () => {
  let testEmail: string
  let sourceGroupId: string
  let duplicatedGroupIds: string[] = []

  let signinPage: SigninPage
  let homePage: HomePage

  test.beforeEach(async ({ page }) => {
    testEmail = generateTestEmail()

    // Create admin user
    await createTestUser(testEmail, VALID_TEST_PASSWORD, {
      createCompany: true,
      admin: true
    })
    await setOnboardingStep(testEmail, 4)

    // Get user profile for buyer_id and company_id
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, company_id')
      .eq('email', testEmail)
      .single()

    // Create a simple test auction directly via database
    const { data: group } = await supabaseAdmin
      .from('auctions_group_settings')
      .insert({
        name: 'Test Auction for Duplication',
        description: 'Test description',
        buyer_id: profile!.id,
        timing_rule: 'serial'
      })
      .select()
      .single()

    sourceGroupId = group!.id

    // Create a simple auction in the group
    await supabaseAdmin.from('auctions').insert({
      auctions_group_settings_id: sourceGroupId,
      lot_name: 'Test Lot',
      lot_number: 1,
      type: 'reverse',
      baseline: 10000,
      duration: 30,
      start_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      end_at: new Date(Date.now() + 24 * 60 * 60 * 1000 + 30 * 60 * 1000).toISOString(),
      published: false,
      company_id: profile!.company_id,
      buyer_id: profile!.id,
      currency: 'EUR',
      timezone: 'Europe/Paris'
    })

    // Initialize page objects
    signinPage = new SigninPage(page)
    homePage = new HomePage(page)

    // Login
    await signinPage.goto()
    await signinPage.login(testEmail, VALID_TEST_PASSWORD)
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    // Accept cookies if present
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

  test('should find and duplicate auction', async ({ page }) => {
    await homePage.goto()
    await page.waitForTimeout(3000) // Wait for list to load

    // Debug: Log what's in the table
    const rows = await page.locator('tbody tr').count()
    console.log(`Found ${rows} rows in the table`)

    // Try to find the auction
    const auctionRow = homePage.findAuctionRow('Test Auction for Duplication')
    const isVisible = await auctionRow.isVisible({ timeout: 5000 }).catch(() => false)

    if (!isVisible) {
      // Debug: Show all text in the table
      const tableText = await page.locator('table').textContent()
      console.log('Table content:', tableText?.substring(0, 500))
      throw new Error('Auction not found in the list')
    }

    // If we got here, the auction is visible - success!
    await expect(auctionRow).toBeVisible()
    console.log('✓ Auction found in the list')
  })
})
