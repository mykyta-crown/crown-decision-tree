/**
 * LotsStepPage - Step 3: Lots configuration (orchestrator)
 * Handles lot tabs and delegates to type-specific form pages
 */

import { Page, expect } from '@playwright/test'

export class LotsStepPage {
  constructor(private page: Page) {}

  /**
   * Get lot tabs container
   */
  get lotTabs() {
    return this.page.locator('.v-tabs')
  }

  /**
   * Get "Add Lot" button
   */
  get addLotButton() {
    return this.page.locator('button').filter({ hasText: /Add Lot|Add lot/i })
  }

  /**
   * Select a specific lot tab by index (0-based)
   */
  async selectLotTab(index: number) {
    const tab = this.page.locator('.v-tab').nth(index)
    await tab.click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Add a new lot
   * Opens timing rule dialog if this is the 2nd lot
   */
  async addLot(timingRule?: 'serial' | 'parallel' | 'staggered') {
    const initialCount = await this.page.locator('.v-tab').count()

    await this.addLotButton.click()
    await this.page.waitForTimeout(500)

    // If adding 2nd+ lot, timing rule dialog appears
    if (initialCount >= 1) {
      const dialog = this.page.locator('.v-dialog').filter({ hasText: /.+/ })

      if (await dialog.isVisible()) {
        if (timingRule) {
          // Select timing rule
          const radio = dialog.locator(`input[type="radio"][value="${timingRule}"]`)
          await radio.check({ force: true })
        }

        // Click confirm
        const confirmButton = dialog.locator('button').filter({ hasText: /Confirm|OK/i })
        await confirmButton.click()

        // Wait for dialog to close
        await expect(dialog).not.toBeVisible({ timeout: 5000 })
      }
    }

    await this.page.waitForTimeout(500)
  }

  /**
   * Remove a lot by index
   */
  async removeLot(index: number) {
    await this.selectLotTab(index)

    const closeButton = this.page.locator('.v-tab').nth(index).locator('button[aria-label="Close"]')
    await closeButton.click()

    // Confirm if there's a confirmation dialog
    const confirmButton = this.page.locator('button').filter({ hasText: /Confirm|Yes|Delete/i })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    await this.page.waitForTimeout(300)
  }

  /**
   * Get number of lots
   */
  async getLotCount(): Promise<number> {
    return await this.page.locator('.v-tab').count()
  }

  /**
   * Get current lot tab name
   */
  async getCurrentLotName(): Promise<string> {
    const activeTab = this.page.locator('.v-tab--selected')
    return (await activeTab.textContent()) || ''
  }

  /**
   * These methods return the current page context for type-specific interactions
   * The type-specific form pages will work with the currently active lot
   */
  getPage(): Page {
    return this.page
  }
}
