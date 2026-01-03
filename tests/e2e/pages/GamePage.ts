import { Page, expect } from '@playwright/test'

export class GamePage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/game')
  }

  async expectNoActiveTournament() {
    await expect(this.page.locator('text=No active tournament')).toBeVisible()
    await expect(this.page.locator('text=Please start a tournament first')).toBeVisible()
  }

  async expectActiveTournament(date: Date) {
    const dateString = date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
    await expect(this.page.locator(`text=${dateString}`)).toBeVisible()
  }

  async tapI(playerNickname: string) {
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname })
    await playerCard.locator('button:has-text("I")').first().click()
  }

  async tapX(playerNickname: string) {
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname })
    await playerCard.locator('button:has-text("X")').first().click()
  }

  async expectEventCount(playerNickname: string, iCount: number, xCount: number) {
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname })
    await expect(playerCard.locator(`button:has-text("I (${iCount})")`)).toBeVisible()
    await expect(playerCard.locator(`button:has-text("X (${xCount})")`)).toBeVisible()
  }

  async expectNetScore(playerNickname: string, netScore: number) {
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname })
    await expect(playerCard.locator(`text=Net: ${netScore}`)).toBeVisible()
  }

  async expectRemainder(playerNickname: string, plusRemainder: number, minusRemainder: number) {
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname })
    await expect(playerCard.locator(`text=+${plusRemainder} / -${minusRemainder}`)).toBeVisible()
  }

  async clickSave() {
    await this.page.click('button:has-text("Save Game")')
  }

  async expectSaveButtonDisabled() {
    await expect(this.page.locator('button:has-text("Save Game")')).toBeDisabled()
  }

  async expectSaveButtonEnabled() {
    await expect(this.page.locator('button:has-text("Save Game")')).toBeEnabled()
  }

  async clickClear() {
    await this.page.click('button:has-text("Clear")')
  }

  async confirmClear() {
    this.page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      await dialog.accept()
    })
    await this.clickClear()
  }

  async expectEventsCleared() {
    // After clearing, all event counts should be 0
    const saveButton = this.page.locator('button:has-text("Save Game")')
    const buttonText = await saveButton.textContent()

    // Assert that the pattern exists - fail if it doesn't
    expect(buttonText).toMatch(/\((\d+)\)/)

    const match = buttonText?.match(/\((\d+)\)/)
    // This should never be null due to the expect above, but TypeScript requires the check
    if (!match) {
      throw new Error(`Expected button text to contain event count pattern, but got: ${buttonText}`)
    }

    // Assert the captured number is 0
    expect(parseInt(match[1])).toBe(0)

    // Additionally assert the button is disabled when events are cleared
    await this.expectSaveButtonDisabled()
  }
}
