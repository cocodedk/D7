import { Page, expect } from '@playwright/test'

export class DashboardPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/')
  }

  async expectActiveTournament(date: Date) {
    const dateString = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    await expect(this.page.locator('text=Active Tournament')).toBeVisible()
    await expect(this.page.locator(`text=${dateString}`)).toBeVisible()
  }

  async expectNoActiveTournament() {
    await expect(this.page.locator('text=No active tournament')).toBeVisible()
  }

  async clickRecordGame() {
    await this.page.click('text=Record Game')
  }

  async clickManageTournaments() {
    await this.page.click('text=Manage Tournaments')
  }

  async expectUndoNotification() {
    await expect(this.page.locator('text=Game saved')).toBeVisible()
  }

  async clickUndo() {
    // Wait for undo response
    await Promise.all([
      this.page.waitForResponse(resp => resp.url().includes('/games/') && resp.request().method() === 'DELETE', { timeout: 10000 }).catch(() => {}),
      this.page.click('button:has-text("Undo")')
    ])
  }

  async expectUndoNotificationGone() {
    // Give time for the notification to disappear after undo
    await expect(this.page.locator('text=Game saved')).not.toBeVisible({ timeout: 10000 })
  }
}
