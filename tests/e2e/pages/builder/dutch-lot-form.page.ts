/**
 * DutchLotFormPage - Dutch auction lot form
 * Handles Dutch-specific fields: round increment, ending price, prebids
 */

import { Page, expect } from '@playwright/test'
import type { TestLineItem } from '../../helpers/builder-helpers'

export class DutchLotFormPage {
  constructor(private page: Page) {}

  // ===== Lot Name =====

  async fillLotName(name: string) {
    const nameInput = this.page.locator('input[type="text"]').filter({ hasText: '' }).first()
    await nameInput.fill(name)
    await this.page.waitForTimeout(200)
  }

  // ===== Dutch-Specific Price Fields =====

  async fillBaseline(value: number) {
    const input = this.page
      .getByLabel(/baseline/i)
      .or(this.page.locator('input[type="number"]').first())
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  async fillRoundIncrement(value: number) {
    // In Dutch, min_bid_decr is labeled "Round Increment"
    const input = this.page
      .getByLabel(/round.*increment/i)
      .or(this.page.locator('input[type="number"]').nth(1))
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  async fillEndingPrice(value: number) {
    // In Dutch, max_bid_decr is labeled "Ending Price"
    const input = this.page
      .getByLabel(/ending.*price/i)
      .or(this.page.locator('input[type="number"]').nth(2))
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  // ===== Duration & Round Duration =====

  async selectDuration(minutes: number) {
    // Duration is the first v-select in the Dutch rules form
    const select = this.page.locator('.v-select').first()
    await select.click()

    const option = this.page.locator('.v-list-item').filter({ hasText: `${minutes} min` })
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()

    await this.page.waitForTimeout(300)
  }

  async selectRoundDuration(minutes: number) {
    // Round duration is the second v-select in the Dutch rules form
    const select = this.page.locator('.v-select').nth(1)
    await select.click()

    // For round duration, values are in seconds format (e.g., "30 sec", "1 min")
    let optionText: string
    if (minutes < 1) {
      optionText = `${minutes * 60} sec`
    } else {
      optionText = `${minutes} min`
    }

    const option = this.page.locator('.v-list-item').filter({ hasText: optionText })
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()

    await this.page.waitForTimeout(300)
  }

  // ===== Prebid Toggle =====

  async enablePrebids() {
    // Scroll to top of the page first (prebid switch is in the rules section at top)
    await this.page.evaluate(() => window.scrollTo(0, 0))
    await this.page.waitForTimeout(500)

    // The label is in a div above the switch, so we need to find the container
    // Look for the text "Pre-bid" and then find the v-switch within the same v-col
    const container = this.page.locator('.v-col').filter({ hasText: /Pre-bid/i })
    const switchElement = container.locator('.v-switch')
    const input = switchElement.locator('input[type="checkbox"]')

    // Wait for the switch to be visible
    await switchElement.waitFor({ state: 'visible', timeout: 5000 })

    // Check current state
    const isChecked = await input.isChecked()

    // If not checked, click the switch to enable it
    if (!isChecked) {
      await switchElement.click({ force: true })
      await this.page.waitForTimeout(300)
    }
  }

  async disablePrebids() {
    // Scroll to top of the page first (prebid switch is in the rules section at top)
    await this.page.evaluate(() => window.scrollTo(0, 0))
    await this.page.waitForTimeout(500)

    // The label is in a div above the switch, so we need to find the container
    const container = this.page.locator('.v-col').filter({ hasText: /Pre-bid/i })
    const switchElement = container.locator('.v-switch')
    const input = switchElement.locator('input[type="checkbox"]')

    // Wait for the switch to be visible
    await switchElement.waitFor({ state: 'visible', timeout: 5000 })

    // Check current state
    const isChecked = await input.isChecked()

    // If checked, click the switch to disable it
    if (isChecked) {
      await switchElement.click({ force: true })
      await this.page.waitForTimeout(300)
    }
  }

  // ===== Starting Price (Calculated, Read-Only) =====

  get startingPriceInput() {
    // Starting Price label is in a separate div above the input
    // Find the container with "Starting Price" text, then get the disabled input
    return this.page
      .locator('div.pb-2')
      .filter({ hasText: /Starting Price/i })
      .locator('input[type="number"]')
      .first()
  }

  async verifyStartingPrice(expectedValue: number) {
    // Scroll to top to see the starting price field (it's in the rules section at top)
    await this.page.evaluate(() => window.scrollTo(0, 0))
    await this.page.waitForTimeout(500)

    await expect(this.startingPriceInput).toHaveValue(expectedValue.toString())
  }

  // ===== Supplier Selection =====

  async selectSuppliers(supplierEmails: string[]) {
    for (const email of supplierEmails) {
      // For Vuetify checkboxes, click the container element instead of the input
      const checkboxContainer = this.page.locator('.v-checkbox').filter({ hasText: email })
      await checkboxContainer.click({ force: true })
      await this.page.waitForTimeout(200)
    }
  }

  // ===== Line Items =====

  get addLineItemButton() {
    // Last button with plus icon (within ceiling price card, not the "Add Lot" button)
    return this.page
      .locator('button')
      .filter({ has: this.page.locator('[class*="mdi-plus"]') })
      .last()
  }

  async addLineItem(item: TestLineItem, itemIndex: number) {
    const table = this.page.locator('.v-data-table tbody')
    const allRows = table.locator('tr')
    const rowCount = await allRows.count()
    const dataRowCount = rowCount - 1

    // Check if we need to add a new row
    if (itemIndex >= dataRowCount) {
      await this.addLineItemButton.click()
      await this.page.waitForTimeout(500)
    }

    // Get the target row (0-indexed)
    const targetRow = allRows.nth(itemIndex)
    const nameInput = targetRow.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })

    // Fill the row fields
    await nameInput.fill(item.name)
    await targetRow.locator('input[type="text"]').nth(1).fill(item.unit)
    await targetRow.locator('input[type="number"]').first().fill(item.quantity.toString())

    // Fill ceiling prices for each supplier
    let priceIndex = 1
    for (const [, price] of Object.entries(item.prices)) {
      await targetRow.locator('input[type="number"]').nth(priceIndex).fill(price.toString())
      priceIndex++
    }

    await this.page.waitForTimeout(300)
  }

  // ===== Rich Text Editors =====

  async fillAwardingPrinciples(content: string) {
    await this.fillRichTextEditor(0, content)
  }

  async fillCommercialTerms(content: string) {
    await this.fillRichTextEditor(1, content)
  }

  async fillGeneralTerms(content: string) {
    await this.fillRichTextEditor(2, content)
  }

  private async fillRichTextEditor(index: number, content: string) {
    const editor = this.page.locator('.ql-editor').nth(index)
    await editor.click()
    await editor.fill(content)
    await this.page.waitForTimeout(300)
  }

  // ===== Complete Form Helper =====

  async fillCompleteLot(data: {
    name: string
    baseline: number
    roundIncrement: number
    endingPrice: number
    duration: number
    roundDuration: number
    prebidsEnabled?: boolean
    suppliers: string[]
    items: TestLineItem[]
    awardingPrinciples: string
    commercialTerms: string
    generalTerms: string
  }) {
    await this.fillLotName(data.name)
    await this.fillBaseline(data.baseline)
    await this.fillRoundIncrement(data.roundIncrement)
    await this.fillEndingPrice(data.endingPrice)
    await this.selectDuration(data.duration)
    await this.selectRoundDuration(data.roundDuration)

    if (data.prebidsEnabled !== undefined) {
      if (data.prebidsEnabled) {
        await this.enablePrebids()
      } else {
        await this.disablePrebids()
      }
    }

    await this.selectSuppliers(data.suppliers)

    // Wait for form to update after supplier selection
    await this.page.waitForTimeout(500)

    for (let i = 0; i < data.items.length; i++) {
      await this.addLineItem(data.items[i], i)
    }

    await this.fillAwardingPrinciples(data.awardingPrinciples)
    await this.fillCommercialTerms(data.commercialTerms)
    await this.fillGeneralTerms(data.generalTerms)
  }
}
