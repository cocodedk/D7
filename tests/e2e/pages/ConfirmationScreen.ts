import { Page, expect } from '@playwright/test'

export class ConfirmationScreen {
  constructor(private page: Page) {}

  async expectVisible() {
    await expect(this.page.locator('h1:has-text("Confirm Game")')).toBeVisible()
  }

  async expectWarning() {
    await expect(this.page.locator('text=Warning: This action is irreversible')).toBeVisible()
  }

  async expectTournament(date: Date) {
    const dateString = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    await expect(this.page.locator(`text=${dateString}`)).toBeVisible()
  }

  async expectPlayerSummary(playerNickname: string, iCount: number, xCount: number) {
    const summary = this.page.locator('.card').filter({ hasText: 'Score Summary' })
    // The row structure is: div > [div with nickname span] + [div with I/X spans]
    // Find the row that contains the specific nickname as a span.font-medium
    const playerRow = summary.locator('div.flex.justify-between').filter({
      has: this.page.locator(`span.font-medium:text-is("${playerNickname}")`)
    })
    await expect(playerRow.locator(`text=I: ${iCount}`)).toBeVisible()
    await expect(playerRow.locator(`text=X: ${xCount}`)).toBeVisible()
  }

  async fillComment(comment: string) {
    await this.page.fill('textarea[id="comment"]', comment)
  }

  async expectCommentCount(current: number, max: number) {
    await expect(this.page.locator(`text=${current}/${max}`)).toBeVisible()
  }

  async clickCancel() {
    await this.page.click('button:has-text("Cancel")')
  }

  async clickConfirmAndSave() {
    await this.page.click('button:has-text("Confirm & Save")')
  }

  async expectConfirmButtonDisabled() {
    await expect(this.page.locator('button:has-text("Confirm & Save")')).toBeDisabled()
  }

  async expectConfirmButtonEnabled() {
    await expect(this.page.locator('button:has-text("Confirm & Save")')).toBeEnabled()
  }
}
