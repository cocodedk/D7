import { Page } from '@playwright/test'

/**
 * Create a test player via the UI
 */
export async function createTestPlayer(
  page: Page,
  name: string,
  nickname: string
): Promise<void> {
  await page.goto('/players')
  await page.click('text=Add Player')
  await page.fill('input[name="name"]', name)
  await page.fill('input[name="nickname"]', nickname)
  await page.click('button:has-text("Save")')

  // Wait for player to appear in list
  await page.waitForSelector(`text=${nickname}`, { timeout: 5000 })
}

/**
 * Create a test tournament via the UI
 */
export async function createTestTournament(page: Page, date: Date): Promise<void> {
  await page.goto('/tournaments')
  await page.click('text=New Tournament')

  // Format date as YYYY-MM-DD for date input
  const dateString = date.toISOString().split('T')[0]
  await page.fill('input[type="date"]', dateString)
  await page.click('button:has-text("Save")')

  // Wait for tournament to appear
  await page.waitForSelector('text=Tournament', { timeout: 5000 })
}

/**
 * Start a tournament via the UI
 * Assumes tournament is in draft state
 */
export async function startTournament(page: Page, tournamentDate: Date): Promise<void> {
  await page.goto('/tournaments')

  // Find the tournament card by date and click start
  const dateString = tournamentDate.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  // Click the start button for the tournament with this date
  await page.click(`text=${dateString}`)
  await page.click('button:has-text("Start")')

  // Wait for active tournament indicator
  await page.waitForSelector('text=Active:', { timeout: 5000 })
}

/**
 * Clean up test data by clearing localStorage and navigating to login
 * Note: This doesn't delete database records, just clears client state
 */
export async function cleanupTestData(page: Page): Promise<void> {
  await page.evaluate(() => {
    localStorage.clear()
  })
  await page.goto('/login')
}
