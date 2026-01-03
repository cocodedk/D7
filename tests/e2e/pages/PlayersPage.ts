import { Page, expect } from '@playwright/test'

export class PlayersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/players')
    // Wait for the page to be ready
    await this.page.waitForSelector('button:has-text("Add Player")', { state: 'visible' })
  }

  async clickAddPlayer() {
    await this.page.click('button:has-text("Add Player")')
  }

  async fillName(name: string) {
    await this.page.fill('input[id="name"]', name)
  }

  async fillNickname(nickname: string) {
    await this.page.fill('input[id="nickname"]', nickname)
  }

  async clickSave() {
    await this.page.click('button:has-text("Save"):not(:has-text("Saving"))')
  }

  async createPlayer(name: string, nickname: string) {
    await this.clickAddPlayer()
    await this.fillName(name)
    await this.fillNickname(nickname)
    await this.clickSave()
    // Wait for form to close by waiting for "Add Player" button to be visible again
    await this.page.waitForSelector('button:has-text("Add Player")', { state: 'visible', timeout: 5000 })
  }

  async expectPlayer(name: string, nickname: string) {
    await expect(this.page.locator(`text=${nickname}`)).toBeVisible()
    await expect(this.page.locator(`text=${name}`)).toBeVisible()
  }

  async clickEdit(playerNickname: string) {
    // Find the player card and click edit button
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname }).first()
    await playerCard.locator('button:has-text("Edit")').click()
  }

  async editPlayer(oldNickname: string, newName: string, newNickname: string) {
    await this.clickEdit(oldNickname)
    await this.fillName(newName)
    await this.fillNickname(newNickname)
    await this.clickSave()
    // Wait for form to close by waiting for "Add Player" button to be visible again
    await this.page.waitForSelector('button:has-text("Add Player")', { state: 'visible', timeout: 5000 })
    // Wait a bit for the player list to update
    await this.page.waitForTimeout(500)
  }

  async clickDelete(playerNickname: string) {
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname }).first()
    await playerCard.locator('button:has-text("Delete")').click()
  }

  async deletePlayer(playerNickname: string) {
    // Set up dialog handler before clicking
    this.page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      expect(dialog.message()).toContain('Delete')
      await dialog.accept()
    })

    // Find the player card to wait for its removal
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname }).first()

    await this.clickDelete(playerNickname)

    // Wait for the player card to be removed from the DOM
    await playerCard.waitFor({ state: 'detached', timeout: 10000 })
  }

  async expectPlayerNotVisible(nickname: string) {
    await expect(this.page.locator(`text=${nickname}`)).not.toBeVisible()
  }
}
