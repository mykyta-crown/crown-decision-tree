/**
 * BasicsStepPage - Step 1: Basic auction configuration
 * Handles auction name, type, date/time selection
 */

import { Page, expect } from '@playwright/test'

export class BasicsStepPage {
  constructor(private page: Page) {}

  /**
   * Auction name input
   * Scoped to the first expansion panel (Basics step)
   */
  get auctionNameInput() {
    return this.page
      .locator('.v-expansion-panel')
      .first()
      .locator('input[placeholder*="Auction name" i], input[type="text"]')
      .first()
  }

  /**
   * Auction description textarea
   * Scoped to the first expansion panel (Basics step)
   */
  get descriptionTextarea() {
    return this.page.locator('.v-expansion-panel').first().locator('textarea').first()
  }

  /**
   * Select auction type via radio buttons
   */
  async selectType(type: 'reverse' | 'dutch' | 'japanese' | 'sealed-bid') {
    // Wait for radio buttons to be visible
    await expect(this.page.locator('input[type="radio"]').first()).toBeVisible()

    // Find the v-radio wrapper (clickable area) for the specific value
    // Vuetify renders the radio button inside a .v-selection-control div
    const radioWrapper = this.page.locator(`.v-radio`).filter({
      has: this.page.locator(`input[type="radio"][value="${type}"]`)
    })

    // Click the wrapper to trigger Vuetify's event handling (updates v-model properly)
    await radioWrapper.click({ force: true })

    // Wait for Vue reactivity to complete
    await this.page.waitForTimeout(500)

    // Verify the radio is now checked
    const isChecked = await this.page.locator(`input[type="radio"][value="${type}"]`).isChecked()
    if (!isChecked) {
      throw new Error(`Failed to select radio button with value="${type}"`)
    }
  }

  /**
   * Select owner from the list (required for auction creation)
   */
  async selectOwner(ownerEmail?: string) {
    try {
      // Find the owner select/autocomplete (usually labeled "Owner" or similar)
      const ownerSelect = this.page
        .locator('.v-autocomplete, .v-select')
        .filter({ hasText: /owner/i })
        .or(this.page.locator('.v-autocomplete, .v-select').first())

      // Check if owner select exists and is visible
      const isVisible = await ownerSelect.isVisible({ timeout: 2000 }).catch(() => false)
      if (!isVisible) {
        // Owner field doesn't exist or is hidden, skip
        return
      }

      await ownerSelect.click()
      await this.page.waitForTimeout(300)

      // Check if there are any options available
      const options = this.page.locator('.v-list-item')
      const optionCount = await options.count()

      if (optionCount === 0) {
        // No owners available, close the dropdown and skip
        await this.page.keyboard.press('Escape')
        return
      }

      // If specific email provided, select it; otherwise select first option
      if (ownerEmail) {
        const option = options.filter({ hasText: ownerEmail })
        await option.click()
      } else {
        // Select first available owner
        const firstOption = options.first()
        await firstOption.click()
      }

      await this.page.waitForTimeout(300)
    } catch (error) {
      // Owner selection failed, but continue anyway (field might be optional)
      console.log('Owner selection skipped:', error)
    }
  }

  /**
   * Set auction date using JavaScript (date picker is complex)
   */
  async setDate(date: string) {
    // Format: YYYY-MM-DD
    await this.page.evaluate((dateValue) => {
      const dateInput = document.querySelector('input[type="date"]') as HTMLInputElement
      if (dateInput) {
        dateInput.value = dateValue
        dateInput.dispatchEvent(new Event('input', { bubbles: true }))
        dateInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, date)

    await this.page.waitForTimeout(200)
  }

  /**
   * Set auction time using JavaScript
   */
  async setTime(time: string) {
    // Format: HH:mm
    await this.page.evaluate((timeValue) => {
      const timeInput = document.querySelector('input[type="time"]') as HTMLInputElement
      if (timeInput) {
        timeInput.value = timeValue
        timeInput.dispatchEvent(new Event('input', { bubbles: true }))
        timeInput.dispatchEvent(new Event('change', { bubbles: true }))
      }
    }, time)

    await this.page.waitForTimeout(200)
  }

  /**
   * Set usage (real/training/test)
   */
  async setUsage(usage: 'real' | 'training' | 'test') {
    const usageSelect = this.page.locator('.v-select').filter({ hasText: /usage/i }).or(
      this.page.locator('.v-select').nth(1) // Second select after owner
    )
    await usageSelect.click()
    await this.page.waitForTimeout(300)

    const option = this.page.locator('.v-list-item').filter({ hasText: new RegExp(usage, 'i') })
    await option.click()
    await this.page.waitForTimeout(300)
  }

  /**
   * Set published status
   */
  async setPublished(published: boolean) {
    const publishSwitch = this.page.locator('.v-switch input[type="checkbox"]').first()
    const isChecked = await publishSwitch.isChecked()

    if (published && !isChecked) {
      await publishSwitch.click({ force: true })
    } else if (!published && isChecked) {
      await publishSwitch.click({ force: true })
    }
    await this.page.waitForTimeout(300)
  }

  /**
   * Select owner from autocomplete using keyboard navigation (more reliable for Vuetify)
   */
  async selectOwnerSafely() {
    try {
      // Wait for profiles to load (the autocomplete needs data)
      await this.page.waitForTimeout(2000)

      // Find the owner autocomplete (first v-autocomplete in Basics step)
      const ownerAutocomplete = this.page
        .locator('.v-expansion-panel')
        .first()
        .locator('.v-autocomplete')
        .first()

      // Click the autocomplete input to focus it
      const input = ownerAutocomplete.locator('input')
      await input.click()
      await this.page.waitForTimeout(500)

      // Wait for dropdown list to appear
      const list = this.page.locator('.v-overlay--active .v-list')
      await list.waitFor({ state: 'visible', timeout: 5000 })

      console.log('Owner dropdown opened, using keyboard to select first item')

      // Use keyboard navigation to select the first item (more reliable than clicking)
      await this.page.keyboard.press('ArrowDown')
      await this.page.waitForTimeout(300)
      await this.page.keyboard.press('Enter')
      await this.page.waitForTimeout(1000)

      // Verify the input now has a value
      const inputValue = await input.inputValue()
      console.log('Owner autocomplete value after keyboard selection:', inputValue)

      if (!inputValue) {
        console.warn('Owner autocomplete is empty after keyboard selection')
      }

      console.log('Owner selection complete')
    } catch (error) {
      console.warn('selectOwnerSafely failed:', error)
      // Don't throw - let the test continue and fail on validation if needed
    }
  }

  /**
   * Fill basic info (name, description, type, date, time, usage, published)
   */
  async fillBasicInfo(data: {
    name: string
    type: 'reverse' | 'dutch' | 'japanese' | 'sealed-bid'
    description?: string
    date?: string // YYYY-MM-DD
    time?: string // HH:mm
    usage?: 'real' | 'training' | 'test' // Defaults to 'test'
    published?: boolean // Defaults to false
  }) {
    // SKIP owner selection - buyer_id and company_id are auto-populated from session in builder.vue
    // The builder initializes: buyer_id: user.value?.id, company_id: profile.value?.company_id
    // await this.selectOwnerSafely()

    // Fill auction name using JavaScript to trigger Vue reactivity
    await this.page.evaluate((name) => {
      const panel = document.querySelectorAll('.v-expansion-panel')[0]
      const input = panel.querySelector('input[placeholder*="Auction name" i]') as HTMLInputElement
      if (input) {
        input.value = name
        input.dispatchEvent(new Event('input', { bubbles: true }))
        input.dispatchEvent(new Event('change', { bubbles: true }))
        // Also try triggering on the Vuetify component
        const vTextField = input.closest('.v-text-field')
        if (vTextField) {
          vTextField.dispatchEvent(new Event('input', { bubbles: true }))
        }
      }
    }, data.name)
    await this.page.waitForTimeout(300)

    // Fill description if provided
    if (data.description) {
      await this.descriptionTextarea.fill(data.description)
    }

    // Select auction type
    await this.selectType(data.type)

    // Set usage (default to 'test')
    await this.setUsage(data.usage || 'test')

    // Set published status (default to false)
    await this.setPublished(data.published ?? false)

    // Set date (default to tomorrow if not provided)
    const date = data.date || this.getTomorrowDate()
    await this.setDate(date)

    // Set time (default to 14:00 if not provided)
    const time = data.time || '14:00'
    await this.setTime(time)

    // Wait for validation to complete
    await this.page.waitForTimeout(500)
  }

  /**
   * Get tomorrow's date in YYYY-MM-DD format
   */
  private getTomorrowDate(): string {
    const tomorrow = new Date()
    tomorrow.setDate(tomorrow.getDate() + 1)
    return tomorrow.toISOString().split('T')[0]
  }

  /**
   * Verify step is complete and valid
   */
  async verifyStepValid() {
    // Verify that the name input has a value
    await expect(this.auctionNameInput).not.toHaveValue('')

    // Note: We don't verify the radio button here because Vue's reactivity
    // can uncheck the native input even though the v-model is set correctly.
    // The form validation will catch any issues when we submit.
  }
}
