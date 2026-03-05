/**
 * SealedBidLotFormPage - Sealed Bid auction lot form
 * Simpler than English - only baseline required, no duration/overtime
 */

import { Page, expect } from '@playwright/test'
import type { TestLineItem } from '../../helpers/builder-helpers'

export class SealedBidLotFormPage {
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

  // Note: Duration, overtime, min/max bid decrements are disabled for sealed-bid

  async selectSuppliers(supplierEmails: string[]) {
    for (const email of supplierEmails) {
      // For Vuetify checkboxes, click the container or label element instead of the input
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
    suppliers: string[]
    items: TestLineItem[]
    awardingPrinciples: string
    commercialTerms: string
    generalTerms: string
  }) {
    await this.fillLotName(data.name)
    await this.fillBaseline(data.baseline)
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
