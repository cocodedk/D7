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
  }

  async clickCreate() {
    await this.page.click('button:has-text("Create")')
  }

  async createTournament(date: Date) {
    await this.clickNewTournament()
    await this.fillTournamentDate(date)
    await this.clickCreate()
    // Wait for form to close
    await this.page.waitForSelector('input[type="date"]', { state: 'hidden', timeout: 5000 })
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
    await expect(this.page.locator(`text=Active: ${dateString}`)).toBeVisible()
  }

  async clickStart(tournamentDate: Date) {
    const dateString = tournamentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const tournamentCard = this.page.locator('.card').filter({ hasText: dateString })
    await tournamentCard.locator('button:has-text("Start Tournament")').click()
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
  }

  async confirmClose(tournamentDate: Date) {
    await this.clickClose(tournamentDate)
    await this.fillCloseConfirmation(tournamentDate)
    await this.page.click('button:has-text("Close Tournament")')
    // Wait for modal to close
    await this.page.waitForSelector('input[type="date"]', { state: 'hidden', timeout: 5000 })
  }

  async expectTournamentClosed(tournamentDate: Date) {
    const dateString = tournamentDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    const tournamentCard = this.page.locator('.card').filter({ hasText: dateString })
    await expect(tournamentCard.locator('text=Closed')).toBeVisible()
  }

  async expectNoActiveTournament() {
    await expect(this.page.locator('text=Active:')).not.toBeVisible()
  }
}
