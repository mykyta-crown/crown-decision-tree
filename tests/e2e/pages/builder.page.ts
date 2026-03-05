/**
 * BuilderPage - Main orchestrator for auction builder
 * Handles navigation between the 3 steps and final submission
 */

import { Page, expect } from '@playwright/test'
import { extractAuctionIdFromUrl, extractGroupIdFromUrl } from '../helpers/auction-helpers'

export class BuilderPage {
  constructor(private page: Page) {}

  /**
   * Navigate to builder page
   */
  async goto() {
    await this.page.goto('/builder', { waitUntil: 'networkidle' })
    // Wait for first expansion panel to be visible (builder is ready)
    await expect(this.page.locator('.v-expansion-panel').first()).toBeVisible({ timeout: 15000 })
  }

  /**
   * Expand Basics step (Step 1)
   */
  async expandBasicsStep() {
    const panel = this.page.locator('.v-expansion-panel').nth(0)
    const content = panel.locator('.v-expansion-panel-text')

    // Only click if panel is collapsed
    if (!(await content.isVisible())) {
      await panel.locator('.v-expansion-panel-title').click()
      await this.page.waitForTimeout(500) // Wait for animation
      await expect(content).toBeVisible()
    }
  }

  /**
   * Expand Suppliers step (Step 2)
   */
  async expandSuppliersStep() {
    const panel = this.page.locator('.v-expansion-panel').nth(1)
    const content = panel.locator('.v-expansion-panel-text')

    if (!(await content.isVisible())) {
      await panel.locator('.v-expansion-panel-title').click()
      await this.page.waitForTimeout(500)
      await expect(content).toBeVisible()
    }
  }

  /**
   * Expand Lots step (Step 3)
   * Note: This may trigger the timing rules dialog which needs to be dismissed
   */
  async expandLotsStep() {
    const panel = this.page.locator('.v-expansion-panel').nth(2)
    const content = panel.locator('.v-expansion-panel-text')

    if (!(await content.isVisible())) {
      await panel.locator('.v-expansion-panel-title').click()
      await this.page.waitForTimeout(500)
      await expect(content).toBeVisible()

      // Handle timing rules dialog if it appears
      await this.dismissTimingRulesDialogIfPresent()
    }
  }

  /**
   * Dismiss the timing rules dialog if it's present
   * This dialog appears when expanding Lots step for the first time
   */
  async dismissTimingRulesDialogIfPresent() {
    const dialog = this.page.locator('.v-dialog').filter({ hasText: /TIMING RULES/i })

    try {
      // Check if dialog is visible (with short timeout)
      await expect(dialog).toBeVisible({ timeout: 2000 })

      // Click Confirm button
      const confirmButton = dialog.locator('button').filter({ hasText: /Confirm/i })
      await confirmButton.click()

      // Wait for dialog to disappear
      await expect(dialog).not.toBeVisible({ timeout: 5000 })
      await this.page.waitForTimeout(300)
    } catch (error) {
      // Dialog not present, continue normally
    }
  }

  /**
   * Check if Basics step is valid (shows checkmark)
   */
  async isBasicsStepValid(): Promise<boolean> {
    const panel = this.page.locator('.v-expansion-panel').nth(0)
    // Look for success indicator in panel title
    const checkmark = panel.locator('[class*="success"]')
    return await checkmark.isVisible()
  }

  /**
   * Check if Suppliers step is valid
   */
  async isSuppliersStepValid(): Promise<boolean> {
    const panel = this.page.locator('.v-expansion-panel').nth(1)
    const checkmark = panel.locator('[class*="success"]')
    return await checkmark.isVisible()
  }

  /**
   * Check if Lots step is valid
   */
  async isLotsStepValid(): Promise<boolean> {
    const panel = this.page.locator('.v-expansion-panel').nth(2)
    const checkmark = panel.locator('[class*="success"]')
    return await checkmark.isVisible()
  }

  /**
   * Get submit button
   */
  get submitButton() {
    return this.page.locator('button').filter({
      hasText: /Create eAuction|Edit|Copy eAuction/
    })
  }

  /**
   * Check if submit button is enabled
   */
  async isSubmitEnabled(): Promise<boolean> {
    return await this.submitButton.isEnabled()
  }

  /**
   * Submit the auction
   * Returns the auction ID extracted from the redirect URL
   */
  async submit(): Promise<{ auctionId: string; groupId: string }> {
    await this.submitButton.click()

    // Wait for redirect to auction detail page
    await this.page.waitForURL(/\/auctions\/.*\/lots\/.*\/buyer/, { timeout: 30000 })

    const url = this.page.url()
    const auctionId = extractAuctionIdFromUrl(url)
    const groupId = extractGroupIdFromUrl(url)

    if (!auctionId || !groupId) {
      throw new Error(`Failed to extract IDs from URL: ${url}`)
    }

    return { auctionId, groupId }
  }

  /**
   * Wait for submit button to be enabled
   */
  async waitForSubmitEnabled(timeout: number = 5000) {
    await expect(this.submitButton).toBeEnabled({ timeout })
  }

  /**
   * Get current URL
   */
  getUrl(): string {
    return this.page.url()
  }

  /**
   * Check if we're in edit mode (has auction_id query param)
   */
  isEditMode(): Promise<boolean> {
    const url = this.page.url()
    return Promise.resolve(url.includes('auction_id='))
  }

  /**
   * Check if we're in copy mode (has copy query param)
   */
  isCopyMode(): Promise<boolean> {
    const url = this.page.url()
    return Promise.resolve(url.includes('copy=true'))
  }
}
