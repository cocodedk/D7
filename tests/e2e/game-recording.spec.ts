import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './fixtures/auth'
import { GamePage } from './pages/GamePage'
import { ConfirmationScreen } from './pages/ConfirmationScreen'
import { DashboardPage } from './pages/DashboardPage'
import { TournamentsPage } from './pages/TournamentsPage'
import { PlayersPage } from './pages/PlayersPage'

test.describe('Game Recording Flow', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should complete full game recording flow', async ({ page }) => {
    // Setup: Create players and active tournament
    const playersPage = new PlayersPage(page)
    await playersPage.goto()

    // Create test players if they don't exist
    try {
      await playersPage.createPlayer('Test Player One', 'Player1')
    } catch {
      // Player might already exist
    }
    try {
      await playersPage.createPlayer('Test Player Two', 'Player2')
    } catch {
      // Player might already exist
    }

    // Create and start tournament
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = new Date()
    try {
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      // Wait for tournament to be active
      await page.waitForTimeout(1000)
    } catch {
      // Tournament might already exist or be active
    }

    // Navigate to game page
    const gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.expectActiveTournament(tournamentDate)

    // Record events: Player1 gets 2 I's, Player2 gets 1 X
    await gamePage.tapI('Player1')
    await gamePage.tapI('Player1')
    await gamePage.tapX('Player2')

    // Verify event counts
    await gamePage.expectEventCount('Player1', 2, 0)
    await gamePage.expectEventCount('Player2', 0, 1)

    // Verify net scores (no clusters yet, so net should be 0)
    await gamePage.expectNetScore('Player1', 0)
    await gamePage.expectNetScore('Player2', 0)

    // Verify remainders
    await gamePage.expectRemainder('Player1', 2, 0)
    await gamePage.expectRemainder('Player2', 0, 1)

    // Click Save
    await gamePage.clickSave()

    // Verify confirmation screen appears
    const confirmationScreen = new ConfirmationScreen(page)
    await confirmationScreen.expectVisible()
    await confirmationScreen.expectWarning()
    await confirmationScreen.expectTournament(tournamentDate)

    // Verify summary shows correct counts
    await confirmationScreen.expectPlayerSummary('Player1', 2, 0)
    await confirmationScreen.expectPlayerSummary('Player2', 0, 1)

    // Add optional comment
    await confirmationScreen.fillComment('Test game comment')

    // Confirm and save
    await confirmationScreen.clickConfirmAndSave()

    // Should redirect to dashboard
    await expect(page).toHaveURL('/')
    const dashboardPage = new DashboardPage(page)
    await dashboardPage.goto()

    // Verify undo notification appears (within 60s window)
    await dashboardPage.expectUndoNotification()
  })

  test('should not allow saving game with no events', async ({ page }) => {
    // Setup: Ensure active tournament exists
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = new Date()

    // Try to create and start tournament if needed
    try {
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      await page.waitForTimeout(1000)
    } catch {
      // Tournament might already exist
    }

    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Save button should be disabled with no events
    await gamePage.expectSaveButtonDisabled()

    // Try to click save (should not work)
    const saveButton = page.locator('button:has-text("Save Game")')
    const isDisabled = await saveButton.isDisabled()
    expect(isDisabled).toBe(true)
  })

  test('should clear events with confirmation', async ({ page }) => {
    // Setup: Ensure active tournament and players exist
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = new Date()
    try {
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      await page.waitForTimeout(1000)
    } catch {
      // Tournament might already exist
    }

    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Add some events
    await gamePage.tapI('Player1')
    await gamePage.tapI('Player1')
    await gamePage.tapX('Player2')

    // Verify events are recorded
    await gamePage.expectEventCount('Player1', 2, 0)
    await gamePage.expectEventCount('Player2', 0, 1)

    // Clear events with confirmation
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      expect(dialog.message()).toContain('Clear all events')
      await dialog.accept()
    })
    await gamePage.clickClear()

    // Verify events are cleared (save button should be disabled)
    await gamePage.expectSaveButtonDisabled()
  })

  test('should cancel confirmation and return to game page', async ({ page }) => {
    // Setup: Ensure active tournament exists
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = new Date()
    try {
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      await page.waitForTimeout(1000)
    } catch {
      // Tournament might already exist
    }

    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Add events
    await gamePage.tapI('Player1')
    await gamePage.tapX('Player2')

    // Click Save to go to confirmation
    await gamePage.clickSave()

    // Cancel confirmation
    const confirmationScreen = new ConfirmationScreen(page)
    await confirmationScreen.expectVisible()
    await confirmationScreen.clickCancel()

    // Should return to game page
    await expect(page).toHaveURL('/game')

    // Events should still be there
    await gamePage.expectEventCount('Player1', 1, 0)
    await gamePage.expectEventCount('Player2', 0, 1)
  })

  test('should display correct scores with clusters', async ({ page }) => {
    // Setup: Ensure active tournament and players exist
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = new Date()
    try {
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      await page.waitForTimeout(1000)
    } catch {
      // Tournament might already exist
    }

    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Player1: 4 I's = 1 cluster, net +1
    await gamePage.tapI('Player1')
    await gamePage.tapI('Player1')
    await gamePage.tapI('Player1')
    await gamePage.tapI('Player1')

    // Verify net score is +1 (1 cluster)
    await gamePage.expectNetScore('Player1', 1)
    await gamePage.expectRemainder('Player1', 0, 0) // No remainder after 4

    // Player2: 5 X's = 1 cluster + 1 remainder, net -1
    await gamePage.tapX('Player2')
    await gamePage.tapX('Player2')
    await gamePage.tapX('Player2')
    await gamePage.tapX('Player2')
    await gamePage.tapX('Player2')

    await gamePage.expectNetScore('Player2', -1)
    await gamePage.expectRemainder('Player2', 0, 1) // 1 remainder after 5
  })
})
