import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './fixtures/auth'
import { TournamentsPage } from './pages/TournamentsPage'
import { GamePage } from './pages/GamePage'

test.describe('Tournament Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should create and start tournament', async ({ page }) => {
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()

    // Create new tournament
    const tournamentDate = new Date()
    await tournamentsPage.createTournament(tournamentDate)

    // Verify tournament appears in list
    await tournamentsPage.expectTournament(tournamentDate)

    // Start tournament
    await tournamentsPage.clickStart(tournamentDate)

    // Verify tournament is marked as active
    await tournamentsPage.expectActiveTournament(tournamentDate)

    // Verify "New Tournament" button is disabled when active exists
    await tournamentsPage.expectNewTournamentButtonDisabled()
  })

  test('should close tournament', async ({ page }) => {
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()

    // Create and start tournament
    const tournamentDate = new Date()
    try {
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      await page.waitForTimeout(1000)
    } catch {
      // Tournament might already exist
    }

    // Close tournament with confirmation
    await tournamentsPage.confirmClose(tournamentDate)

    // Verify tournament is marked as closed
    await tournamentsPage.expectTournamentClosed(tournamentDate)

    // Verify no active tournament
    await tournamentsPage.expectNoActiveTournament()

    // Verify "New Tournament" button is enabled again
    await tournamentsPage.expectNewTournamentButtonEnabled()
  })

  test('should enforce only one active tournament', async ({ page }) => {
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()

    // Create and start tournament A
    const tournamentDateA = new Date()
    tournamentDateA.setDate(tournamentDateA.getDate() + 1)

    try {
      await tournamentsPage.createTournament(tournamentDateA)
      await tournamentsPage.clickStart(tournamentDateA)
      await page.waitForTimeout(1000)
    } catch {
      // Tournament might already exist
    }

    // Verify "New Tournament" button is disabled
    await tournamentsPage.expectNewTournamentButtonDisabled()

    // Close tournament A
    await tournamentsPage.confirmClose(tournamentDateA)
    await page.waitForTimeout(1000)

    // Now should be able to create new tournament
    await tournamentsPage.expectNewTournamentButtonEnabled()

    // Create and start tournament B
    const tournamentDateB = new Date()
    tournamentDateB.setDate(tournamentDateB.getDate() + 2)

    await tournamentsPage.createTournament(tournamentDateB)
    await tournamentsPage.clickStart(tournamentDateB)

    // Verify tournament B is active
    await tournamentsPage.expectActiveTournament(tournamentDateB)
  })

  test('should prevent game recording for closed tournament', async ({ page }) => {
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()

    // Create, start, and close tournament
    const tournamentDate = new Date()
    try {
      await tournamentsPage.createTournament(tournamentDate)
      await tournamentsPage.clickStart(tournamentDate)
      await page.waitForTimeout(1000)
      await tournamentsPage.confirmClose(tournamentDate)
      await page.waitForTimeout(1000)
    } catch {
      // Tournament might already exist
    }

    // Try to navigate to game page
    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Should show message about no active tournament
    await gamePage.expectNoActiveTournament()
  })
})
