import { Page } from '@playwright/test'

/**
 * Get admin password from environment variable
 * Throws error if not set to prevent accidental use of wrong password
 */
export function getTestAdminPassword(): string {
  const password = process.env.ADMIN_PASSWORD
  if (!password) {
    throw new Error('ADMIN_PASSWORD environment variable must be set for E2E tests')
  }
  return password
}

/**
 * Login as admin using the login page
 */
export async function loginAsAdmin(page: Page, password?: string): Promise<void> {
  const adminPassword = password || getTestAdminPassword()

  await page.goto('/login')
  await page.fill('input[type="password"]', adminPassword)
  await page.click('button[type="submit"]')

  // Wait for navigation to complete (should redirect to dashboard, not login)
  await page.waitForURL(url => url.pathname !== '/login', { timeout: 5000 })

  // Verify we're authenticated by checking for auth token in localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  if (!token) {
    throw new Error('Login failed: No auth token found in localStorage')
  }
}

/**
 * Logout by clearing auth token and navigating to login
 */
export async function logout(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.removeItem('auth_token')
  })
  await page.goto('/login')
}

/**
 * Check if user is authenticated by verifying auth token exists
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  return !!token
}
