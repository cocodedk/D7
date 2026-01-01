import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, assertError, generateNonExistentId } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import {
  createTestPlayer,
  createTestTournament,
  createTestGame,
  createTestScoreEvent,
  cleanupTestData,
} from './test-data'
import { handler as gamesHandler } from '../../netlify/functions/games/index'
import { handler as gameHandler } from '../../netlify/functions/games/[id]'

describe('Games Integration Tests', () => {
  let authToken: string
  let tournamentId: string
  let playerId: string

  beforeEach(async () => {
    // CRITICAL: Ensure handlers use test database
    // Delete NETLIFY_DATABASE_URL first (it takes priority), then set DATABASE_URL
    delete process.env.NETLIFY_DATABASE_URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    // Reset the pool so it recreates with correct DATABASE_URL
    // getDbPool() now checks TEST_DATABASE_URL in test mode automatically
    try {
      const { resetDbPool, getDbPool, getPoolConnectionString } = await import('../../netlify/functions/_shared/db')

      // Reset any existing pool
      await resetDbPool()

      // Force pool creation to verify it uses TEST_DATABASE_URL
      const testPool = getDbPool()

      // Verify the pool is using the correct connection string
      const actualConnectionString = getPoolConnectionString()
      if (actualConnectionString !== process.env.TEST_DATABASE_URL) {
        throw new Error(
          `Pool verification failed in beforeEach: Expected TEST_DATABASE_URL, ` +
          `but pool is using: ${actualConnectionString?.substring(0, 30)}...`
        )
      }
    } catch (error) {
      // Fail fast if pool setup is wrong
      throw new Error(`Failed to setup test database pool: ${error}`)
    }

    await resetTestDatabase()

    // Get auth token
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

    // Create test data
    tournamentId = await createTestTournament({ name: 'Test Tournament', state: 'active' })
    playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })

    // Small delay to ensure data is committed to database
    await new Promise(resolve => setTimeout(resolve, 100))
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('POST /api/games', () => {
    it('should create a game with score events', async () => {
      const response = await invokeFunction(gamesHandler, {
        httpMethod: 'POST',
        path: '/api/games',
        body: {
          tournamentId,
          events: [
            { playerId, type: 'I' },
            { playerId, type: 'X' },
          ],
          comment: 'Test game',
        },
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.statusCode).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('tournament_id', tournamentId)
      expect(response.body).toHaveProperty('comment', 'Test game')
    })

    it('should create a game with photo', async () => {
      const photoBase64 = Buffer.from('test-photo-data').toString('base64')

      const response = await invokeFunction(gamesHandler, {
        httpMethod: 'POST',
        path: '/api/games',
        body: {
          tournamentId,
          events: [{ playerId, type: 'I' }],
          photo: photoBase64,
        },
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('photo')
    })

    it('should return 400 if tournament ID is missing', async () => {
      const response = await invokeFunction(gamesHandler, {
        httpMethod: 'POST',
        path: '/api/games',
        body: {
          events: [{ playerId, type: 'I' }],
        },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
    })

    it('should return 400 if events array is empty', async () => {
      const response = await invokeFunction(gamesHandler, {
        httpMethod: 'POST',
        path: '/api/games',
        body: {
          tournamentId,
          events: [],
        },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
    })

    it('should return 404 if tournament not found', async () => {
      const response = await invokeFunction(gamesHandler, {
        httpMethod: 'POST',
        path: '/api/games',
        body: {
          tournamentId: generateNonExistentId(),
          events: [{ playerId, type: 'I' }],
        },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 404)
    })

    it('should return 400 if tournament is not active', async () => {
      const draftTournamentId = await createTestTournament({ state: 'draft' })

      const response = await invokeFunction(gamesHandler, {
        httpMethod: 'POST',
        path: '/api/games',
        body: {
          tournamentId: draftTournamentId,
          events: [{ playerId, type: 'I' }],
        },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
    })

    it('should require authentication', async () => {
      const response = await invokeFunction(gamesHandler, {
        httpMethod: 'POST',
        path: '/api/games',
        body: {
          tournamentId,
          events: [{ playerId, type: 'I' }],
        },
      })

      assertError(response, 401)
    })
  })

  describe('GET /api/games/:id', () => {
    it('should return game with score events', async () => {
      const gameId = await createTestGame(tournamentId)

      // Small delay to ensure game is committed
      await new Promise(resolve => setTimeout(resolve, 50))

      await createTestScoreEvent(gameId, playerId, 'I')
      await createTestScoreEvent(gameId, playerId, 'X')

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'GET',
        path: `/api/games/${gameId}`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('id', gameId)
      expect(response.body).toHaveProperty('events')
      expect(Array.isArray((response.body as { events?: unknown[] }).events)).toBe(true)
      expect(((response.body as { events?: unknown[] }).events?.length || 0)).toBe(2)
    })

    it('should return 404 if game not found', async () => {
      const response = await invokeFunction(gameHandler, {
        httpMethod: 'GET',
        path: `/api/games/${generateNonExistentId()}`,
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 404)
    })

    it('should require authentication', async () => {
      const gameId = await createTestGame(tournamentId)

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'GET',
        path: `/api/games/${gameId}`,
      })

      assertError(response, 401)
    })
  })

  describe('DELETE /api/games/:id', () => {
    it('should delete game within 60 seconds', async () => {
      const gameId = await createTestGame(tournamentId)

      // Small delay to ensure game is committed
      await new Promise(resolve => setTimeout(resolve, 50))

      await createTestScoreEvent(gameId, playerId, 'I')

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'DELETE',
        path: `/api/games/${gameId}`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)

      // Verify game is deleted
      const pool = (await import('./db-test-setup')).getTestDbPool()
      const result = await pool.query('SELECT id FROM games WHERE id = $1', [gameId])
      expect(result.rows.length).toBe(0)
    })

    it('should return 404 if game not found', async () => {
      const response = await invokeFunction(gameHandler, {
        httpMethod: 'DELETE',
        path: `/api/games/${generateNonExistentId()}`,
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 404)
    })

    it('should require authentication', async () => {
      const gameId = await createTestGame(tournamentId)

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'DELETE',
        path: `/api/games/${gameId}`,
      })

      assertError(response, 401)
    })
  })
})
