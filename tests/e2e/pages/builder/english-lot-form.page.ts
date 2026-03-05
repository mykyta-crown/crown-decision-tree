/**
 * EnglishLotFormPage - English/Reverse auction lot form
 * Handles all fields specific to English auctions
 */

import { Page, expect } from '@playwright/test'
import type { TestLineItem } from '../../helpers/builder-helpers'

export class EnglishLotFormPage {
  constructor(private page: Page) {}

  // ===== Lot Name & Rules =====

  get lotNameInput() {
    return this.page.locator('input[type="text"]').filter({ hasText: '' }).first()
  }

  async fillLotName(name: string) {
    // Find the lot name input (usually has placeholder or is first text input in lot form)
    const nameInput = this.page.locator('input').filter({ hasText: '' }).first()
    await nameInput.fill(name)
    await this.page.waitForTimeout(200)
  }

  // ===== Price Fields =====

  async fillBaseline(value: number) {
    const input = this.page
      .getByLabel(/baseline/i)
      .or(this.page.locator('input[type="number"]').first())
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  async fillMinBidDecrement(value: number) {
    // Second number input in form (after baseline)
    const input = this.page.locator('input[type="number"]').nth(1)
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  async fillMaxBidDecrement(value: number) {
    // Third number input in form (after baseline and min decrement)
    const input = this.page.locator('input[type="number"]').nth(2)
    await input.fill(value.toString())
    await this.page.waitForTimeout(200)
  }

  // ===== Duration & Overtime =====

  async fillDuration(minutes: number) {
    const input = this.page
      .getByLabel(/duration/i)
      .or(this.page.locator('input[type="number"]').nth(3))
    await input.fill(minutes.toString())
    await this.page.waitForTimeout(200)
  }

  async selectOvertime(minutes: number) {
    // Overtime is a v-select (first/only one in English form)
    const select = this.page.locator('.v-select').first()
    await select.click()

    const option = this.page.locator('.v-list-item').filter({ hasText: `${minutes} min` })
    await option.click()

    await this.page.waitForTimeout(300)
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

  // ===== Line Items (Ceiling Price Form) =====

  get addLineItemButton() {
    // Last button with plus icon (within ceiling price card, not the "Add Lot" button)
    return this.page
      .locator('button')
      .filter({ has: this.page.locator('[class*="mdi-plus"]') })
      .last()
  }

  async addLineItem(item: TestLineItem, itemIndex: number) {
    const table = this.page.locator('.v-data-table tbody')

    // Get all rows (excluding the "Add new line item" button row)
    const allRows = table.locator('tr')
    const rowCount = await allRows.count()

    // The last row is the "Add new line item" button, so data rows are at index 0 to rowCount-2
    const dataRowCount = rowCount - 1

    // Check if we need to add a new row
    if (itemIndex >= dataRowCount) {
      // Click "Add new line item" button
      await this.addLineItemButton.click()
      await this.page.waitForTimeout(500)
    }

    // Get the target row (0-indexed)
    const targetRow = allRows.nth(itemIndex)

    // Wait for row to be ready
    const nameInput = targetRow.locator('input[type="text"]').first()
    await expect(nameInput).toBeVisible({ timeout: 5000 })

    // Fill the row fields
    await nameInput.fill(item.name)
    await targetRow.locator('input[type="text"]').nth(1).fill(item.unit)
    await targetRow.locator('input[type="number"]').first().fill(item.quantity.toString())

    // Fill ceiling prices for each supplier
    let priceIndex = 1 // Start from 2nd number input (1st is quantity)
    for (const [email, price] of Object.entries(item.prices)) {
      await targetRow.locator('input[type="number"]').nth(priceIndex).fill(price.toString())
      priceIndex++
    }

    await this.page.waitForTimeout(300)
  }

  // ===== Rich Text Editors (QuillEditor) =====

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

  // ===== Complete Lot Form Helper =====

  async fillCompleteLot(data: {
    name: string
    baseline: number
    minBidDecr: number
    maxBidDecr: number
    duration: number
    overtime: number
    suppliers: string[]
    items: TestLineItem[]
    awardingPrinciples: string
    commercialTerms: string
    generalTerms: string
  }) {
    // 1. Lot name
    await this.fillLotName(data.name)

    // 2. Price rules
    await this.fillBaseline(data.baseline)
    await this.fillMinBidDecrement(data.minBidDecr)
    await this.fillMaxBidDecrement(data.maxBidDecr)

    // 3. Duration & overtime
    await this.fillDuration(data.duration)
    await this.selectOvertime(data.overtime)

    // 4. Select suppliers
    await this.selectSuppliers(data.suppliers)

    // Wait for form to update after supplier selection
    await this.page.waitForTimeout(500)

    // 5. Add line items
    for (let i = 0; i < data.items.length; i++) {
      await this.addLineItem(data.items[i], i)
    }

    // 6. Fill rich text editors
    await this.fillAwardingPrinciples(data.awardingPrinciples)
    await this.fillCommercialTerms(data.commercialTerms)
    await this.fillGeneralTerms(data.generalTerms)

    // Click outside to trigger blur and validation
    await this.page.locator('body').click({ position: { x: 10, y: 10 } })

    // Wait for final form validation to complete
    await this.page.waitForTimeout(1000)
  }

  // ===== Verification =====

  async verifyFormValid() {
    // Check that lot name is filled
    const nameInput = this.page.locator('input[type="text"]').first()
    await expect(nameInput).not.toHaveValue('')

    // Check that at least one supplier is selected
    const checkedSuppliers = this.page.locator('input[type="checkbox"]:checked')
    const supplierCount = await checkedSuppliers.count()
    expect(supplierCount).toBeGreaterThanOrEqual(1)

    // Check that at least one line item exists
    const table = this.page.locator('.v-data-table tbody tr')
    const rowCount = await table.count()
    expect(rowCount).toBeGreaterThanOrEqual(1)
  }
}
