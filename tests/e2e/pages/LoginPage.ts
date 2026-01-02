import { Page, expect } from '@playwright/test'

export class LoginPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/login')
  }

  async fillPassword(password: string) {
    await this.page.fill('input[type="password"]', password)
  }

  async clickLogin() {
    await this.page.click('button[type="submit"]')
  }

  async login(password: string) {
    await this.fillPassword(password)
    await this.clickLogin()
  }

  async expectError(message: string) {
    await expect(this.page.locator('.text-red-500')).toContainText(message)
  }

  async expectOnLoginPage() {
    await expect(this.page).toHaveURL(/\/login/)
    await expect(this.page.locator('h1')).toContainText('D7 Card Game')
  }

  async expectPublicResultsLink() {
    await expect(this.page.locator('a[href="/public"]')).toBeVisible()
  }
}
