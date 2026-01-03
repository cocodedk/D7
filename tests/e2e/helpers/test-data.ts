import { Page } from '@playwright/test'

/**
 * Generate a unique tournament date that won't collide with existing tournaments
 * Uses timestamp to calculate a unique date far in the future
 * Each millisecond maps to a different day to avoid collisions
 */
export function generateUniqueTournamentDate(): Date {
  const now = Date.now()
  // Use full milliseconds to calculate days offset from a base date
  // This ensures truly unique dates even for parallel tests
  const daysFromNow = now % 100000 // ~273 years of unique days
  const randomOffset = Math.floor(Math.random() * 1000) // Extra randomness
  
  const date = new Date()
  date.setFullYear(2100) // Start far in future to avoid any existing data
  date.setDate(date.getDate() + daysFromNow + randomOffset)
  return date
}

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

/**
 * Close any active tournament via API
 * This ensures tests can start with a clean state
 */
export async function closeAnyActiveTournament(page: Page): Promise<void> {
  // Get auth token from localStorage
  const token = await page.evaluate(() => localStorage.getItem('auth_token'))
  if (!token) {
    console.log('[closeAnyActiveTournament] No auth token, skipping')
    return
  }

  // Check for active tournament
  const baseUrl = 'http://localhost:8888'
  const activeResponse = await page.evaluate(async ({ baseUrl, token }) => {
    try {
      const resp = await fetch(`${baseUrl}/api/tournaments/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (!resp.ok) return null
      return await resp.json()
    } catch {
      return null
    }
  }, { baseUrl, token })

  if (!activeResponse || !activeResponse.id) {
    console.log('[closeAnyActiveTournament] No active tournament found')
    return
  }

  console.log(`[closeAnyActiveTournament] Closing active tournament: ${activeResponse.id}`)

  // Close the active tournament
  await page.evaluate(async ({ baseUrl, token, id, date }) => {
    try {
      await fetch(`${baseUrl}/api/tournaments/${id}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ confirmation: date })
      })
    } catch (e) {
      console.error('[closeAnyActiveTournament] Failed to close:', e)
    }
  }, { baseUrl, token, id: activeResponse.id, date: activeResponse.date })

  // Wait a moment for state to update
  await page.waitForTimeout(500)
}
