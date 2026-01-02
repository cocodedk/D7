import { Page, expect } from '@playwright/test'

export class PlayersPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/players')
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
    // Wait for form to close
    await this.page.waitForSelector('input[id="name"]', { state: 'hidden', timeout: 5000 })
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
    // Wait for form to close
    await this.page.waitForSelector('input[id="name"]', { state: 'hidden', timeout: 5000 })
  }

  async clickDelete(playerNickname: string) {
    const playerCard = this.page.locator('.card').filter({ hasText: playerNickname }).first()
    await playerCard.locator('button:has-text("Delete")').click()
  }

  async confirmDelete() {
    this.page.on('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      await dialog.accept()
    })
  }

  async deletePlayer(playerNickname: string) {
    await this.clickDelete(playerNickname)
    await this.confirmDelete()
    // Wait for player to be removed
    await this.page.waitForTimeout(500)
  }

  async expectPlayerNotVisible(nickname: string) {
    await expect(this.page.locator(`text=${nickname}`)).not.toBeVisible()
  }
}
