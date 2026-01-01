import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, getTestAdminPassword } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import {
  createTestPlayer,
  createTestTournament,
  cleanupTestData,
} from './test-data'
import { handler as gamesHandler } from '../../netlify/functions/games/index'
import { handler as gameHandler } from '../../netlify/functions/games/[id]'

describe('Transaction Integrity E2E Tests', () => {
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

    const adminPassword = getTestAdminPassword()
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

  it('should create game and all events atomically', async () => {
    // Create game with multiple events
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
          { playerId, type: 'X' },
          { playerId, type: 'X' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!
    expect(gameId).toBeDefined()

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify game exists
    const pool = (await import('./db-test-setup')).getTestDbPool()
    const gameResult = await pool.query('SELECT id FROM games WHERE id = $1', [gameId])
    expect(gameResult.rows.length).toBe(1)

    // Verify all events exist
    const eventsResult = await pool.query(
      'SELECT id, type FROM score_events WHERE game_id = $1 ORDER BY created_at',
      [gameId]
    )
    expect(eventsResult.rows.length).toBe(6)

    // Verify event types
    const types = eventsResult.rows.map((row: { type: string }) => row.type)
    expect(types.filter((t: string) => t === 'I').length).toBe(4)
    expect(types.filter((t: string) => t === 'X').length).toBe(2)
  })

  it('should retrieve game with all events correctly', async () => {
    // Create game with multiple events
    const createResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'X' },
          { playerId, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Retrieve game
    const getResponse = await invokeFunction(gameHandler, {
      httpMethod: 'GET',
      path: `/api/games/${gameId}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(getResponse)
    const game = getResponse.body as {
      id: string
      events: Array<{ playerId: string; type: 'I' | 'X' }>
    }

    expect(game.id).toBe(gameId)
    expect(game.events.length).toBe(3)
    expect(game.events.filter(e => e.type === 'I').length).toBe(2)
    expect(game.events.filter(e => e.type === 'X').length).toBe(1)
  })

  it('should handle game with many events in single transaction', async () => {
    // Create game with 20 events
    const events = []
    for (let i = 0; i < 20; i++) {
      events.push({ playerId, type: i % 2 === 0 ? 'I' : 'X' })
    }

    const createResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events,
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify all events were created
    const pool = (await import('./db-test-setup')).getTestDbPool()
    const eventsResult = await pool.query(
      'SELECT COUNT(*) as count FROM score_events WHERE game_id = $1',
      [gameId]
    )
    expect(parseInt(eventsResult.rows[0].count, 10)).toBe(20)
  })

  it('should maintain referential integrity between games and events', async () => {
    // Create game with events
    const createResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify foreign key relationship
    const pool = (await import('./db-test-setup')).getTestDbPool()
    const eventsResult = await pool.query(
      `SELECT se.id, se.game_id, g.id as game_exists
       FROM score_events se
       JOIN games g ON se.game_id = g.id
       WHERE se.game_id = $1`,
      [gameId]
    )

    expect(eventsResult.rows.length).toBe(2)
    eventsResult.rows.forEach((row: { game_id: string; game_exists: string }) => {
      expect(row.game_id).toBe(gameId)
      expect(row.game_exists).toBe(gameId)
    })
  })

  it('should delete game and cascade to events', async () => {
    // Create game with events
    const createResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'X' },
          { playerId, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    const gameId = (createResponse.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Delete game
    const deleteResponse = await invokeFunction(gameHandler, {
      httpMethod: 'DELETE',
      path: `/api/games/${gameId}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(deleteResponse)

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify game is deleted
    const pool = (await import('./db-test-setup')).getTestDbPool()
    const gameResult = await pool.query('SELECT id FROM games WHERE id = $1', [gameId])
    expect(gameResult.rows.length).toBe(0)

    // Verify events are also deleted
    const eventsResult = await pool.query(
      'SELECT id FROM score_events WHERE game_id = $1',
      [gameId]
    )
    expect(eventsResult.rows.length).toBe(0)
  })
})
