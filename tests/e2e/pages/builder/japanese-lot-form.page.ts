/**
 * JapaneseLotFormPage - Japanese auction lot form
 * Similar to Dutch but with ascending price logic
 */

import { Page, expect } from '@playwright/test'
import type { TestLineItem } from '../../helpers/builder-helpers'

export class JapaneseLotFormPage {
  constructor(private page: Page) {}

  async fillLotName(name: string) {
    const nameInput = this.page.locator('input[type="text"]').filter({ hasText: '' }).first()
    await nameInput.fill(name)
    await this.page.waitForTimeout(200)
  }

  async fillBaseline(value: number) {
    const input = this.page.locator('input[type="number"]').first()
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  async fillRoundDecrement(value: number) {
    // In Japanese, min_bid_decr is labeled "Round Decrement"
    const input = this.page.locator('input[type="number"]').nth(1)
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  async fillStartingPrice(value: number) {
    // In Japanese, max_bid_decr is labeled "Starting Price"
    const input = this.page.locator('input[type="number"]').nth(2)
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  async selectDuration(minutes: number) {
    // Duration is the first v-select in the Japanese rules form
    const select = this.page.locator('.v-select').first()
    await expect(select).toBeVisible({ timeout: 5000 })
    await select.click()

    const option = this.page.locator('.v-list-item').filter({ hasText: `${minutes} min` })
    await expect(option).toBeVisible({ timeout: 5000 })
    await option.click()
    await this.page.waitForTimeout(300)
  }

  async selectRoundDuration(minutes: number) {
    // Round duration is the second v-select in the Japanese rules form
    const select = this.page.locator('.v-select').nth(1)
    await expect(select).toBeVisible({ timeout: 5000 })
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

  async selectSuppliers(supplierEmails: string[]) {
    for (const email of supplierEmails) {
      // For Vuetify checkboxes, click the container element instead of the input
      const checkboxContainer = this.page.locator('.v-checkbox').filter({ hasText: email })
      await checkboxContainer.click({ force: true })
      await this.page.waitForTimeout(200)
    }
  }

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

  async fillCompleteLot(data: {
    name: string
    baseline: number
    roundDecrement: number
    startingPrice: number
    duration: number
    roundDuration: number
    suppliers: string[]
    items: TestLineItem[]
    awardingPrinciples: string
    commercialTerms: string
    generalTerms: string
  }) {
    await this.fillLotName(data.name)
    await this.fillBaseline(data.baseline)
    await this.fillRoundDecrement(data.roundDecrement)
    await this.fillStartingPrice(data.startingPrice)
    await this.selectDuration(data.duration)
    await this.selectRoundDuration(data.roundDuration)
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
