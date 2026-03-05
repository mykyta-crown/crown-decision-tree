/**
 * SuppliersStepPage - Step 2: Supplier management
 * Handles searching and adding suppliers
 */

import { Page, expect } from '@playwright/test'

export class SuppliersStepPage {
  constructor(private page: Page) {}

  /**
   * Search autocomplete input
   */
  get searchInput() {
    return this.page.locator('.v-autocomplete input[type="text"]').first()
  }

  /**
   * "Add new supplier" button
   */
  get addNewSupplierButton() {
    return this.page
      .locator('button.v-btn')
      .filter({ hasText: /Add new supplier|Invite new supplier/i })
  }

  /**
   * Suppliers data table
   */
  get suppliersTable() {
    return this.page.locator('.v-data-table')
  }

  /**
   * Search and add existing supplier by email
   */
  async searchAndAddSupplier(email: string) {
    // Click on autocomplete to open dropdown
    await this.searchInput.click()
    await this.page.waitForTimeout(300)

    // Type email
    await this.searchInput.fill(email)
    await this.page.waitForTimeout(500) // Wait for search results

    // Click on matching list item
    const listItem = this.page.locator('.v-list-item').filter({ hasText: email })
    await expect(listItem).toBeVisible({ timeout: 5000 })
    await listItem.click()

    // Wait for supplier to be added to table
    await this.page.waitForTimeout(500)
  }

  /**
   * Add new supplier via dialog
   */
  async addNewSupplier(email: string, phone: string) {
    // Click "Add new supplier" button
    await this.addNewSupplierButton.click()

    // Wait for dialog to appear
    const dialog = this.page.locator('.v-dialog').filter({ hasText: /.+/ })
    await expect(dialog).toBeVisible()

    // Fill email
    const emailInput = dialog.locator('input[type="email"], input[type="text"]').first()
    await emailInput.fill(email)

    // Fill phone
    const phoneInput = dialog.locator('input[type="tel"], input[type="text"]').nth(1)
    await phoneInput.fill(phone)

    // Click "Invite" or "Add" button
    const submitButton = dialog.locator('button').filter({ hasText: /Invite|Add/i })
    await submitButton.click()

    // Wait for dialog to close
    await expect(dialog).not.toBeVisible({ timeout: 5000 })

    // Wait for supplier to be added
    await this.page.waitForTimeout(500)
  }

  /**
   * Add multiple suppliers at once
   */
  async addSuppliers(suppliers: Array<{ email: string; phone: string; existing?: boolean }>) {
    for (const supplier of suppliers) {
      if (supplier.existing) {
        await this.searchAndAddSupplier(supplier.email)
      } else {
        await this.addNewSupplier(supplier.email, supplier.phone)
      }
    }
  }

  /**
   * Verify supplier was added to table
   */
  async verifySupplierAdded(email: string) {
    const row = this.suppliersTable.locator('tr').filter({ hasText: email })
    await expect(row).toBeVisible()
  }

  /**
   * Get number of suppliers in table
   */
  async getSupplierCount(): Promise<number> {
    const rows = await this.suppliersTable.locator('tbody tr').count()
    return rows
  }

  /**
   * Remove supplier by email
   */
  async removeSupplier(email: string) {
    const row = this.suppliersTable.locator('tr').filter({ hasText: email })
    const deleteButton = row.locator('button[aria-label="Delete"]')
    await deleteButton.click()

    // Confirm if there's a confirmation dialog
    const confirmButton = this.page.locator('button').filter({ hasText: /Confirm|Yes|Delete/i })
    if (await confirmButton.isVisible()) {
      await confirmButton.click()
    }

    await this.page.waitForTimeout(300)
  }

  /**
   * Verify step is complete (at least 1 supplier added)
   */
  async verifyStepValid() {
    const count = await this.getSupplierCount()
    expect(count).toBeGreaterThan(0)
  }
}
