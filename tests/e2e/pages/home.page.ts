import { Page, expect, Locator } from '@playwright/test'

export class HomePage {
  constructor(private page: Page) {}

  // Locators

  /**
   * Get menu button (kebab icon) for a specific auction
   */
  auctionMenuButton(auctionName: string): Locator {
    // The kebab menu is in the last cell of the row
    // It contains an img and a button - we need to click the button, not the img
    const row = this.page.locator('tr').filter({ hasText: auctionName })
    return row.locator('td').last().locator('button')
  }

  /**
   * "Duplicate" menu item in the actions menu
   */
  get duplicateMenuItem(): Locator {
    // Use getByText for simplicity - finds the clickable element with this text
    return this.page.getByText('Duplicate', { exact: true })
  }

  /**
   * Duplication dialog
   */
  get duplicationDialog(): Locator {
    return this.page
      .locator('.v-dialog')
      .filter({ hasText: /choose.*duplication|choisir.*duplication/i })
  }

  /**
   * "Flat" radio button in duplication dialog
   */
  get flatRadio(): Locator {
    return this.page.locator('input[value="flat"]')
  }

  /**
   * "Training" radio button in duplication dialog
   */
  get trainingRadio(): Locator {
    return this.page.locator('input[value="training"]')
  }

  /**
   * "Duplicate" button in dialog
   */
  get dialogDuplicateButton(): Locator {
    return this.duplicationDialog.locator('button').filter({ hasText: /^duplicate$|^dupliquer$/i })
  }

  /**
   * "Cancel" button in dialog
   */
  get dialogCancelButton(): Locator {
    return this.duplicationDialog.locator('button').filter({ hasText: /cancel|annuler/i })
  }

  /**
   * Toast notification
   */
  get toast(): Locator {
    return this.page.locator('.v-snackbar, [role="alert"]').filter({ hasText: /enchère|auction/i })
  }

  /**
   * Skeleton loader (indicates datatable is refreshing)
   */
  get skeletonLoader(): Locator {
    return this.page.locator('.v-skeleton-loader')
  }

  // Actions

  /**
   * Navigate to home page
   */
  async goto() {
    await this.page.goto('/home')
    await this.page.waitForLoadState('networkidle')
  }

  /**
   * Open duplicate dialog for a specific auction
   */
  async openDuplicateDialog(auctionName: string) {
    const menuButton = this.auctionMenuButton(auctionName)
    await menuButton.click()
    await this.duplicateMenuItem.click()
    await expect(this.duplicationDialog).toBeVisible({ timeout: 5000 })
  }

  /**
   * Select duplication type (flat or training)
   */
  async selectDuplicationType(type: 'flat' | 'training') {
    if (type === 'flat') {
      await this.flatRadio.check()
    } else {
      await this.trainingRadio.check()
    }
  }

  /**
   * Click the "Duplicate" button to confirm
   */
  async confirmDuplication() {
    await this.dialogDuplicateButton.click()
  }

  /**
   * Wait for success toast to appear
   */
  async waitForSuccessToast(expectedCount?: number) {
    await expect(this.toast).toBeVisible({ timeout: 10000 })

    if (expectedCount !== undefined) {
      await expect(this.toast).toContainText(`${expectedCount}`)
    }

    await expect(this.toast).toContainText(/créée.*succès|created.*success/i)
  }

  /**
   * Wait for error toast to appear
   */
  async waitForErrorToast() {
    await expect(this.toast).toBeVisible({ timeout: 10000 })
    await expect(this.toast).toContainText(/échec|failed|error/i)
  }

  /**
   * Wait for datatable to refresh (skeleton loader appears then disappears)
   */
  async waitForDatatableRefresh() {
    // Wait for skeleton loader to appear
    await expect(this.skeletonLoader)
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // If skeleton doesn't appear quickly, the refresh might have already completed
        console.log('Skeleton loader did not appear (refresh may have been very fast)')
      })

    // Wait for it to disappear
    await expect(this.skeletonLoader).not.toBeVisible({ timeout: 10000 })
  }

  /**
   * Find an auction row by name (matches rows containing the name)
   */
  findAuctionRow(auctionName: string): Locator {
    // Simple filter by text content - works but may match multiple rows
    // Tests should use unique enough names or check database instead of UI
    return this.page.locator('tr').filter({ hasText: auctionName }).first()
  }

  /**
   * Check if an auction exists in the list
   */
  async hasAuction(auctionName: string): Promise<boolean> {
    try {
      await expect(this.findAuctionRow(auctionName)).toBeVisible({ timeout: 2000 })
      return true
    } catch {
      return false
    }
  }

  // Assertion helpers

  /**
   * Assert that the duplication dialog is visible
   */
  async expectDialogVisible() {
    await expect(this.duplicationDialog).toBeVisible()
  }

  /**
   * Assert that the duplication dialog is not visible
   */
  async expectDialogHidden() {
    await expect(this.duplicationDialog).not.toBeVisible()
  }

  /**
   * Assert that an auction appears in the datatable
   */
  async expectAuctionVisible(auctionName: string) {
    await expect(this.findAuctionRow(auctionName)).toBeVisible({ timeout: 10000 })
  }
}
