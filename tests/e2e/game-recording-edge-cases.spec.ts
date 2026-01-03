import { test, expect } from '@playwright/test'
import { loginAsAdmin, setPageTitleToTestName } from './fixtures/auth'
import { GamePage } from './pages/GamePage'
import { TournamentsPage } from './pages/TournamentsPage'
import { DashboardPage } from './pages/DashboardPage'
import { ConfirmationScreen } from './pages/ConfirmationScreen'
import { PlayersPage } from './pages/PlayersPage'
import { closeAnyActiveTournament, generateUniqueTournamentDate } from './helpers/test-data'

test.describe('Game Recording Edge Cases', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await loginAsAdmin(page)
    await setPageTitleToTestName(page, testInfo)
    // Ensure no active tournament blocks our test
    await closeAnyActiveTournament(page)
  })

  test('should show message when no active tournament', async ({ page }) => {
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()

    // Ensure no active tournament (close any existing active ones)
    // This test assumes there's no active tournament, or we need to close any existing ones
    // For simplicity, we'll just navigate to game page and check the message

    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Should show message about no active tournament
    await gamePage.expectNoActiveTournament()
  })

  test('should allow undo within 60 seconds', async ({ page }) => {
    // Track created resources for cleanup
    const createdPlayerNicknames: string[] = []
    const createdTournamentDates: Date[] = []

    try {
      // Setup: Create players and active tournament
      const playersPage = new PlayersPage(page)
      await playersPage.goto()

      // Create test player with unique identifier
      const timestamp = Date.now() + Math.random()
      const playerNickname = `Player${timestamp}`
      await playersPage.createPlayer(`Test Player ${timestamp}`, playerNickname)
      createdPlayerNicknames.push(playerNickname)

      // Create and start tournament with unique date
      const tournamentsPage = new TournamentsPage(page)
      await tournamentsPage.goto()
      const tournamentDate = generateUniqueTournamentDate()
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      await tournamentsPage.expectActiveTournament(tournamentDate)
      createdTournamentDates.push(tournamentDate)

      // Record a game
      const gamePage = new GamePage(page)
      await gamePage.goto()

      // Add some events
      await gamePage.tapI(playerNickname)
      await gamePage.tapI(playerNickname)

      // Save the game
      await gamePage.clickSave()

      const confirmationScreen = new ConfirmationScreen(page)
      await confirmationScreen.expectVisible()
      await confirmationScreen.clickConfirmAndSave()

      // Should redirect to dashboard
      await expect(page).toHaveURL('/')
      const dashboardPage = new DashboardPage(page)
      await dashboardPage.goto()

      // Verify undo notification appears
      await dashboardPage.expectUndoNotification()

      // Click undo
      await dashboardPage.clickUndo()

      // Wait for page to reload and undo notification to disappear
      await page.waitForLoadState('networkidle')
      await dashboardPage.expectUndoNotificationGone()
      await expect(page).toHaveURL('/')
    } finally {
      // Cleanup: Delete created players and close tournaments
      const playersPage = new PlayersPage(page)
      const tournamentsPage = new TournamentsPage(page)

      for (const nickname of createdPlayerNicknames) {
        try {
          await playersPage.goto()
          await playersPage.deletePlayer(nickname)
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      for (const date of createdTournamentDates) {
        try {
          await tournamentsPage.goto()
          await tournamentsPage.confirmClose(date)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  })

  test('should handle game recording with multiple players', async ({ page }) => {
    // Track created resources for cleanup
    const createdPlayerNicknames: string[] = []
    const createdTournamentDates: Date[] = []

    try {
      // Setup: Create multiple players and active tournament
      const playersPage = new PlayersPage(page)
      await playersPage.goto()

      const timestamp = Date.now() + Math.random()
      const players = [
        { name: `Player A ${timestamp}`, nickname: `PlayerA${timestamp}` },
        { name: `Player B ${timestamp}`, nickname: `PlayerB${timestamp}` },
        { name: `Player C ${timestamp}`, nickname: `PlayerC${timestamp}` },
      ]

      for (const player of players) {
        await playersPage.createPlayer(player.name, player.nickname)
        createdPlayerNicknames.push(player.nickname)
      }

      // Create and start tournament with unique date
      const tournamentsPage = new TournamentsPage(page)
      await tournamentsPage.goto()
      const tournamentDate = generateUniqueTournamentDate()
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      await tournamentsPage.expectActiveTournament(tournamentDate)
      createdTournamentDates.push(tournamentDate)

      // Record game with multiple players
      const gamePage = new GamePage(page)
      await gamePage.goto()

      // Add events for each player
      await gamePage.tapI(players[0].nickname)
      await gamePage.tapI(players[0].nickname)
      await gamePage.tapX(players[1].nickname)
      await gamePage.tapI(players[2].nickname)
      await gamePage.tapI(players[2].nickname)
      await gamePage.tapI(players[2].nickname)

      // Verify all events are recorded
      await gamePage.expectEventCount(players[0].nickname, 2, 0)
      await gamePage.expectEventCount(players[1].nickname, 0, 1)
      await gamePage.expectEventCount(players[2].nickname, 3, 0)

      // Save and verify confirmation shows all players
      await gamePage.clickSave()

      const confirmationScreen = new ConfirmationScreen(page)
      await confirmationScreen.expectVisible()
      await confirmationScreen.expectPlayerSummary(players[0].nickname, 2, 0)
      await confirmationScreen.expectPlayerSummary(players[1].nickname, 0, 1)
      await confirmationScreen.expectPlayerSummary(players[2].nickname, 3, 0)

      // Confirm and save
      await confirmationScreen.clickConfirmAndSave()
      await expect(page).toHaveURL('/')
    } finally {
      // Cleanup: Delete created players and close tournaments
      const playersPage = new PlayersPage(page)
      const tournamentsPage = new TournamentsPage(page)

      for (const nickname of createdPlayerNicknames) {
        try {
          await playersPage.goto()
          await playersPage.deletePlayer(nickname)
        } catch (error) {
          // Ignore cleanup errors
        }
      }

      for (const date of createdTournamentDates) {
        try {
          await tournamentsPage.goto()
          await tournamentsPage.confirmClose(date)
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }
  })
})
