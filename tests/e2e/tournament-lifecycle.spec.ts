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

    // Create and start tournament with unique date to avoid collisions
    const tournamentDate = new Date()
    tournamentDate.setDate(tournamentDate.getDate() + Math.floor(Math.random() * 365))
    await tournamentsPage.createTournament(tournamentDate)
    await tournamentsPage.clickStart(tournamentDate)
    await tournamentsPage.expectActiveTournament(tournamentDate)

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

    // Create and start tournament A with unique date
    const tournamentDateA = new Date()
    tournamentDateA.setDate(tournamentDateA.getDate() + Math.floor(Math.random() * 365) + 1)
    await tournamentsPage.createTournament(tournamentDateA)
    await tournamentsPage.clickStart(tournamentDateA)
    await tournamentsPage.expectActiveTournament(tournamentDateA)

    // Verify "New Tournament" button is disabled
    await tournamentsPage.expectNewTournamentButtonDisabled()

    // Close tournament A
    await tournamentsPage.confirmClose(tournamentDateA)
    await tournamentsPage.expectNoActiveTournament()

    // Now should be able to create new tournament
    await tournamentsPage.expectNewTournamentButtonEnabled()

    // Create and start tournament B with unique date
    const tournamentDateB = new Date()
    tournamentDateB.setDate(tournamentDateB.getDate() + Math.floor(Math.random() * 365) + 2)
    await tournamentsPage.createTournament(tournamentDateB)
    await tournamentsPage.clickStart(tournamentDateB)

    // Verify tournament B is active
    await tournamentsPage.expectActiveTournament(tournamentDateB)
  })

  test('should prevent game recording for closed tournament', async ({ page }) => {
    const tournamentsPage = new TournamentsPage(page)
    await tournamentsPage.goto()

    // Create, start, and close tournament with unique date
    const tournamentDate = new Date()
    tournamentDate.setDate(tournamentDate.getDate() + Math.floor(Math.random() * 365))
    await tournamentsPage.createTournament(tournamentDate)
    await tournamentsPage.clickStart(tournamentDate)
    await tournamentsPage.expectActiveTournament(tournamentDate)
    await tournamentsPage.confirmClose(tournamentDate)
    await tournamentsPage.expectTournamentClosed(tournamentDate)

    // Try to navigate to game page
    const gamePage = new GamePage(page)
    await gamePage.goto()

    // Should show message about no active tournament
    await gamePage.expectNoActiveTournament()
  })
})
