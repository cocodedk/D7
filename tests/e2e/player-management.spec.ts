import { test, expect } from '@playwright/test'
import { loginAsAdmin } from './fixtures/auth'
import { PlayersPage } from './pages/PlayersPage'

test.describe('Player Management', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page)
  })

  test('should create player', async ({ page }) => {
    const playersPage = new PlayersPage(page)
    await playersPage.goto()

    // Create a unique player name to avoid conflicts
    const timestamp = Date.now()
    const name = `Test Player ${timestamp}`
    const nickname = `Player${timestamp}`

    await playersPage.createPlayer(name, nickname)

    // Verify player appears in list
    await playersPage.expectPlayer(name, nickname)
  })

  test('should edit player', async ({ page }) => {
    const playersPage = new PlayersPage(page)
    await playersPage.goto()

    // Create a player first
    const timestamp = Date.now()
    const originalName = `Original Name ${timestamp}`
    const originalNickname = `OriginalNick${timestamp}`

    await playersPage.createPlayer(originalName, originalNickname)
    await playersPage.expectPlayer(originalName, originalNickname)

    // Edit the player
    const newName = `Updated Name ${timestamp}`
    const newNickname = `UpdatedNick${timestamp}`

    await playersPage.editPlayer(originalNickname, newName, newNickname)

    // Verify changes are reflected
    await playersPage.expectPlayer(newName, newNickname)
    // Old nickname should not be visible
    await playersPage.expectPlayerNotVisible(originalNickname)
  })

  test('should delete player', async ({ page }) => {
    const playersPage = new PlayersPage(page)
    await playersPage.goto()

    // Create a player first
    const timestamp = Date.now()
    const name = `Delete Test ${timestamp}`
    const nickname = `DeleteNick${timestamp}`

    await playersPage.createPlayer(name, nickname)
    await playersPage.expectPlayer(name, nickname)

    // Delete the player
    page.once('dialog', async dialog => {
      expect(dialog.type()).toBe('confirm')
      expect(dialog.message()).toContain('Delete')
      await dialog.accept()
    })
    await playersPage.deletePlayer(nickname)

    // Verify player is removed
    await playersPage.expectPlayerNotVisible(nickname)
  })
})
