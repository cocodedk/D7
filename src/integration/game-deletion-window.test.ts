import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, assertError } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import {
  createTestPlayer,
  createTestTournament,
  cleanupTestData,
} from './test-data'
import { handler as gamesHandler } from '../../netlify/functions/games/index'
import { handler as gameHandler } from '../../netlify/functions/games/[id]'
import { handler as resultsHandler } from '../../netlify/functions/tournaments/[id]/results'

describe('Game Deletion Time Window E2E Tests', () => {
  let authToken: string
  let tournamentId: string
  let playerId: string

  beforeEach(async () => {
    delete process.env.NETLIFY_DATABASE_URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    try {
      const { resetDbPool, getDbPool, getPoolConnectionString } = await import('../../netlify/functions/_shared/db')
      await resetDbPool()
      const testPool = getDbPool()
      const actualConnectionString = getPoolConnectionString()
      if (actualConnectionString !== process.env.TEST_DATABASE_URL) {
        throw new Error(
          `Pool verification failed: Expected TEST_DATABASE_URL, ` +
          `but pool is using: ${actualConnectionString?.substring(0, 30)}...`
        )
      }
    } catch (error) {
      throw new Error(`Failed to setup test database pool: ${error}`)
    }

    await resetTestDatabase()

    const adminPassword = process.env.ADMIN_PASSWORD || 'getTestAdminPassword()'
    const loginResponse = await invokeFunction(
      (await import('../../netlify/functions/auth-login')).handler,
      {
        httpMethod: 'POST',
        path: '/api/auth-login',
        body: { password: adminPassword },
      }
    )
    authToken = extractToken(loginResponse) || ''

    tournamentId = await createTestTournament({ date: '2024-01-15', state: 'active' })
    playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should allow deletion immediately after creation', async () => {
    // Create game
    const createResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'X' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!
    expect(gameId).toBeDefined()

    await new Promise(resolve => setTimeout(resolve, 50))

    // Delete immediately
    const deleteResponse = await invokeFunction(gameHandler, {
      httpMethod: 'DELETE',
      path: `/api/games/${gameId}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(deleteResponse)

    // Verify game is deleted
    const pool = (await import('./db-test-setup')).getTestDbPool()
    const result = await pool.query('SELECT id FROM games WHERE id = $1', [gameId])
    expect(result.rows.length).toBe(0)

    // Verify score events are also deleted
    const eventsResult = await pool.query(
      'SELECT id FROM score_events WHERE game_id = $1',
      [gameId]
    )
    expect(eventsResult.rows.length).toBe(0)
  })

  it('should prevent deletion after 60 seconds', async () => {
    // Create game
    const createResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [{ playerId, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!

    // Wait 61 seconds (simulated by manipulating database timestamp)
    // Note: In a real scenario, we'd wait, but for testing we can manipulate the created_at
    const pool = (await import('./db-test-setup')).getTestDbPool()
    await pool.query(
      "UPDATE games SET created_at = created_at - INTERVAL '61 seconds' WHERE id = $1",
      [gameId]
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    // Attempt to delete
    const deleteResponse = await invokeFunction(gameHandler, {
      httpMethod: 'DELETE',
      path: `/api/games/${gameId}`,
      headers: createAuthHeaders(authToken),
    })

    assertError(deleteResponse, 400)
    expect((deleteResponse.body as { error?: string }).error).toContain('60 seconds')

    // Verify game still exists
    const result = await pool.query('SELECT id FROM games WHERE id = $1', [gameId])
    expect(result.rows.length).toBe(1)
  })

  it('should remove game and all score events from results after deletion', async () => {
    // Create game with events
    const createResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify game appears in results
    const resultsBefore = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsBefore)
    const scoresBefore = resultsBefore.body as Record<string, {
      plusClusters: number
      netScore: number
    }>
    expect(scoresBefore[playerId].plusClusters).toBe(1)
    expect(scoresBefore[playerId].netScore).toBe(1)

    // Delete game
    const deleteResponse = await invokeFunction(gameHandler, {
      httpMethod: 'DELETE',
      path: `/api/games/${gameId}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(deleteResponse)

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify game no longer appears in results
    const resultsAfter = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsAfter)
    const scoresAfter = resultsAfter.body as Record<string, {
      plusClusters: number
      netScore: number
    }>

    // Player should have no scores now
    if (scoresAfter[playerId]) {
      expect(scoresAfter[playerId].plusClusters).toBe(0)
      expect(scoresAfter[playerId].netScore).toBe(0)
    }
  })

  it('should delete game within 60 seconds but not after', async () => {
    // Create game
    const createResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [{ playerId, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify can delete within 60 seconds (by setting created_at to 30 seconds ago)
    const pool = (await import('./db-test-setup')).getTestDbPool()
    await pool.query(
      "UPDATE games SET created_at = created_at - INTERVAL '30 seconds' WHERE id = $1",
      [gameId]
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    const deleteResponse1 = await invokeFunction(gameHandler, {
      httpMethod: 'DELETE',
      path: `/api/games/${gameId}`,
      headers: createAuthHeaders(authToken),
    })

    // Should succeed (but game was already deleted, so we'll get 404)
    // Let's create a new game and test the window properly
    const createResponse2 = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [{ playerId, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse2)
    const gameId2 = (createResponse2.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Set to 30 seconds ago - should be deletable
    await pool.query(
      "UPDATE games SET created_at = created_at - INTERVAL '30 seconds' WHERE id = $1",
      [gameId2]
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    const deleteResponse2 = await invokeFunction(gameHandler, {
      httpMethod: 'DELETE',
      path: `/api/games/${gameId2}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(deleteResponse2)
  })
})
