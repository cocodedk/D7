import { Page, expect } from '@playwright/test'

export class TournamentsPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/tournaments')
  }

  async clickNewTournament() {
    await this.page.click('button:has-text("New Tournament")')
  }

  async expectNewTournamentButtonDisabled() {
    await expect(this.page.locator('button:has-text("New Tournament")')).toBeDisabled()
  }

  async expectNewTournamentButtonEnabled() {
    await expect(this.page.locator('button:has-text("New Tournament")')).toBeEnabled()
  }

  async fillTournamentDate(date: Date) {
    const dateString = date.toISOString().split('T')[0]
    await this.page.fill('input[type="date"]', dateString)
    // Blur the input to close any date picker dropdown
    await this.page.locator('input[type="date"]').blur()
  }

  async clickCreate() {
    // Click the Create button inside the modal
    const modal = this.page.locator('.fixed.inset-0')
    await modal.locator('button:has-text("Create")').click()
  }

  async createTournament(date: Date) {
    await this.clickNewTournament()
    await this.fillTournamentDate(date)
    await this.clickCreate()

    // Wait for the form modal to actually disappear from the DOM
    // The modal has class "fixed inset-0" - wait for it to be removed
    await this.page.waitForSelector('.fixed.inset-0', {
      state: 'detached',
      timeout: 10000
    }).catch(async () => {
      // Fallback: wait for the "New Tournament" heading to disappear
      await this.page.waitForSelector('h2:has-text("New Tournament")', {
        state: 'hidden',
        timeout: 5000
      })
    })

    // Wait for the tournament to appear in the list
    // This confirms: API call succeeded, state updated, React re-rendered
    await this.expectTournament(date)
  }

  async expectTournament(date: Date) {
    const dateString = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    await expect(this.page.locator(`text=${dateString}`)).toBeVisible()
  }

  async expectActiveTournament(date: Date) {
    const dateString = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    // Wait for the active tournament banner to appear
    // The banner contains text "Active: [date]" in a card with green background
    const activeText = `Active: ${dateString}`
    // First try to find the text anywhere on the page, then verify it's in the right card
    // The active banner is in a card with green background classes
    const activeBanner = this.page
      .locator('.card')
      .filter({ hasText: activeText })
      .first()

    // Wait with a longer timeout and retry logic
    await expect(activeBanner).toBeVisible({ timeout: 15000 })
  }

  async clickStart(tournamentDate: Date) {
    const dateString = tournamentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const tournamentCard = this.page.locator('.card').filter({ hasText: dateString })

    // Click the button and optionally wait for network request (with timeout)
    await Promise.all([
      // Try to wait for start request (with timeout - don't fail if it doesn't match)
      this.page.waitForResponse(
        resp => resp.url().includes('/tournaments/') && resp.url().includes('/start'),
        { timeout: 5000 }
      ).catch(() => {}),
      // Click the button
      tournamentCard.locator('button:has-text("Start Tournament")').click()
    ])

    // Wait a moment for the API call and state update
    await this.page.waitForTimeout(1000)
  }

  async clickClose(tournamentDate: Date) {
    const dateString = tournamentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const tournamentCard = this.page.locator('.card').filter({ hasText: dateString })
    await tournamentCard.locator('button:has-text("Close")').click()
  }

  async fillCloseConfirmation(tournamentDate: Date) {
    // The confirmation uses a date input, format as YYYY-MM-DD
    const dateString = tournamentDate.toISOString().split('T')[0]
    // Wait for the modal to appear
    await this.page.waitForSelector('input[type="date"]', { state: 'visible' })
    await this.page.fill('input[type="date"]', dateString)
    // Blur the input to close any date picker dropdown
    await this.page.locator('input[type="date"]').blur()
  }

  async confirmClose(tournamentDate: Date) {
    await this.clickClose(tournamentDate)
    await this.fillCloseConfirmation(tournamentDate)
    // Click the Close Tournament button inside the modal
    const modal = this.page.locator('.fixed.inset-0')
    await modal.locator('button:has-text("Close Tournament")').click()
    // Wait for modal to close
    await this.page.waitForSelector('.fixed.inset-0', { state: 'hidden', timeout: 5000 }).catch(() => {})
  }

  async expectTournamentClosed(tournamentDate: Date) {
    const dateString = tournamentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const tournamentCard = this.page.locator('.card').filter({ hasText: dateString })
    // Match the badge specifically, not the "Closed: date" text
    await expect(tournamentCard.locator('span:has-text("closed")')).toBeVisible()
  }

  async expectNoActiveTournament() {
    await expect(this.page.locator('text=Active:')).not.toBeVisible()
  }
}
