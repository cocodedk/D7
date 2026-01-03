import { test, expect } from '@playwright/test'
import { loginAsAdmin, setPageTitleToTestName } from './fixtures/auth'
import { GamePage } from './pages/GamePage'
import { ConfirmationScreen } from './pages/ConfirmationScreen'
import { DashboardPage } from './pages/DashboardPage'
import { TournamentsPage } from './pages/TournamentsPage'
import { PlayersPage } from './pages/PlayersPage'
import { closeAnyActiveTournament, generateUniqueTournamentDate } from './helpers/test-data'

test.describe('Game Recording Flow', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await loginAsAdmin(page)
    await setPageTitleToTestName(page, testInfo)
    // Ensure no active tournament blocks our test
    await closeAnyActiveTournament(page)
  })

  test('should complete full game recording flow', async ({ page }) => {
    // Setup: Create players and active tournament with unique identifiers
    const playersPage = new PlayersPage(page)
    await playersPage.goto()

    // Create test players with unique identifiers to avoid collisions
    const timestamp = Date.now() + Math.random()
    const player1Nickname = `Player1-${timestamp}`
    const player2Nickname = `Player2-${timestamp}`
    await playersPage.createPlayer(`Test Player One ${timestamp}`, player1Nickname)
    await playersPage.createPlayer(`Test Player Two ${timestamp}`, player2Nickname)

    // Create and start tournament with unique date
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = generateUniqueTournamentDate()
    await tournamentsPage.createTournament(tournamentDate)
    await tournamentsPage.clickStart(tournamentDate)
    await tournamentsPage.expectActiveTournament(tournamentDate)

    // Navigate to game page
    const gamePage = new GamePage(page)
    await gamePage.goto()
    await gamePage.expectActiveTournament(tournamentDate)

    // Record events: Player1 gets 2 I's, Player2 gets 1 X
    await gamePage.tapI(player1Nickname)
    await gamePage.tapI(player1Nickname)
    await gamePage.tapX(player2Nickname)

    // Verify event counts
    await gamePage.expectEventCount(player1Nickname, 2, 0)
    await gamePage.expectEventCount(player2Nickname, 0, 1)

    // Verify net scores (no clusters yet, so net should be 0)
    await gamePage.expectNetScore('Player1', 0)
    await gamePage.expectNetScore('Player2', 0)

    // Verify remainders
    await gamePage.expectRemainder(player1Nickname, 2, 0)
    await gamePage.expectRemainder(player2Nickname, 0, 1)

    // Click Save
    await gamePage.clickSave()

    // Verify confirmation screen appears
    const confirmationScreen = new ConfirmationScreen(page)
    await confirmationScreen.expectVisible()
    await confirmationScreen.expectWarning()
    await confirmationScreen.expectTournament(tournamentDate)

    // Verify summary shows correct counts
    await confirmationScreen.expectPlayerSummary(player1Nickname, 2, 0)
    await confirmationScreen.expectPlayerSummary(player2Nickname, 0, 1)

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
    // Setup: Ensure active tournament exists with unique date
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = generateUniqueTournamentDate()
    await tournamentsPage.createTournament(tournamentDate)
    await tournamentsPage.clickStart(tournamentDate)
    await tournamentsPage.expectActiveTournament(tournamentDate)

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
    // Setup: Ensure active tournament and players exist with unique identifiers
    const timestamp = Date.now() + Math.random()
    const player1Nickname = `Player1-${timestamp}`
    const player2Nickname = `Player2-${timestamp}`

    const playersPage = new PlayersPage(page)
    await playersPage.goto()
    await playersPage.createPlayer(`Test Player One ${timestamp}`, player1Nickname)
    await playersPage.createPlayer(`Test Player Two ${timestamp}`, player2Nickname)

    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = generateUniqueTournamentDate()
    await tournamentsPage.createTournament(tournamentDate)
    await tournamentsPage.clickStart(tournamentDate)
    await tournamentsPage.expectActiveTournament(tournamentDate)

    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Add some events
    await gamePage.tapI(player1Nickname)
    await gamePage.tapI(player1Nickname)
    await gamePage.tapX(player2Nickname)

    // Verify events are recorded
    await gamePage.expectEventCount(player1Nickname, 2, 0)
    await gamePage.expectEventCount(player2Nickname, 0, 1)

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
    // Setup: Ensure active tournament exists with unique identifiers
    const timestamp = Date.now() + Math.random()
    const player1Nickname = `Player1-${timestamp}`
    const player2Nickname = `Player2-${timestamp}`

    const playersPage = new PlayersPage(page)
    await playersPage.goto()
    await playersPage.createPlayer(`Test Player One ${timestamp}`, player1Nickname)
    await playersPage.createPlayer(`Test Player Two ${timestamp}`, player2Nickname)

    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = generateUniqueTournamentDate()
    await tournamentsPage.createTournament(tournamentDate)
    await tournamentsPage.clickStart(tournamentDate)
    await tournamentsPage.expectActiveTournament(tournamentDate)

    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Add events
    await gamePage.tapI(player1Nickname)
    await gamePage.tapX(player2Nickname)

    // Click Save to go to confirmation
    await gamePage.clickSave()

    // Cancel confirmation
    const confirmationScreen = new ConfirmationScreen(page)
    await confirmationScreen.expectVisible()
    await confirmationScreen.clickCancel()

    // Should return to game page
    await expect(page).toHaveURL('/game')

    // Events should still be there
    await gamePage.expectEventCount(player1Nickname, 1, 0)
    await gamePage.expectEventCount(player2Nickname, 0, 1)
  })

  test('should display correct scores with clusters', async ({ page }) => {
    // Setup: Ensure active tournament and players exist with unique identifiers
    const timestamp = Date.now() + Math.random()
    const player1Nickname = `Player1-${timestamp}`
    const player2Nickname = `Player2-${timestamp}`

    const playersPage = new PlayersPage(page)
    await playersPage.goto()
    await playersPage.createPlayer(`Test Player One ${timestamp}`, player1Nickname)
    await playersPage.createPlayer(`Test Player Two ${timestamp}`, player2Nickname)

    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()
    const tournamentDate = generateUniqueTournamentDate()
    await tournamentsPage.createTournament(tournamentDate)
    await tournamentsPage.clickStart(tournamentDate)
    await tournamentsPage.expectActiveTournament(tournamentDate)

    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Player1: 4 I's = 1 cluster, net +1
    await gamePage.tapI(player1Nickname)
    await gamePage.tapI(player1Nickname)
    await gamePage.tapI(player1Nickname)
    await gamePage.tapI(player1Nickname)

    // Verify net score is +1 (1 cluster)
    await gamePage.expectNetScore(player1Nickname, 1)
    await gamePage.expectRemainder(player1Nickname, 0, 0) // No remainder after 4

    // Player2: 5 X's = 1 cluster + 1 remainder, net -1
    await gamePage.tapX(player2Nickname)
    await gamePage.tapX(player2Nickname)
    await gamePage.tapX(player2Nickname)
    await gamePage.tapX(player2Nickname)
    await gamePage.tapX(player2Nickname)

    await gamePage.expectNetScore(player2Nickname, -1)
    await gamePage.expectRemainder(player2Nickname, 0, 1) // 1 remainder after 5
  })
})
