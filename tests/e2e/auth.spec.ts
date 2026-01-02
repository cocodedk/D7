import { test, expect } from '@playwright/test'
import { loginAsAdmin, logout, getTestAdminPassword } from './fixtures/auth'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'

test.describe('Authentication', () => {
  test('should login successfully with valid password', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.login(getTestAdminPassword())

    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    // Verify we're authenticated
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeTruthy()
  })

  test('should show error with invalid password', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.fillPassword('wrong-password')
    await loginPage.clickLogin()

    // Should show error and stay on login page
    await loginPage.expectError('Invalid password')
    await loginPage.expectOnLoginPage()

    // Should not have auth token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeNull()
  })

  test('should logout successfully', async ({ page }) => {
    // First login
    await loginAsAdmin(page)

    // Navigate to dashboard to verify we're logged in
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()
    await expect(page).toHaveURL('/')

    // Logout
    await logout(page)

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)

    // Should not have auth token
    const token = await page.evaluate(() => localStorage.getItem('auth_token'))
    expect(token).toBeNull()
  })

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Clear any existing auth
    await page.evaluate(() => localStorage.removeItem('auth_token'))

    // Try to access protected route
    await page.goto('/')

    // Should redirect to login
    await expect(page).toHaveURL(/\/login/)

    const loginPage = new LoginPage(page)
    await loginPage.expectOnLoginPage()
  })

  test('should show public results link on login page', async ({ page }) => {
    const loginPage = new LoginPage(page)
    await loginPage.goto()
    await loginPage.expectPublicResultsLink()
  })
})
