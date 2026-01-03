import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, assertError, getTestAdminPassword } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import {
  createTestPlayer,
  createTestTournament,
  createTestGame,
  createTestScoreEvent,
  cleanupTestData,
} from './test-data'
import { handler as tournamentResultsHandler } from '../../netlify/functions/tournaments/[id]/results'
import { handler as yearlyResultsHandler } from '../../netlify/functions/results/yearly/[year]'
import { handler as gameHandler } from '../../netlify/functions/games/[id]'

describe('Public Results Integration Tests', () => {
  let authToken: string

  beforeAll(async () => {
    // Get auth token once per test file (cached for all tests)
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
  })

  beforeEach(async () => {
    // CRITICAL: Ensure handlers use test database
    delete process.env.NETLIFY_DATABASE_URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    await resetTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/tournaments/:id/results (Public)', () => {
    it('should return tournament results without authentication', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })


      const gameId = await createTestGame(tournamentId)
      await createTestScoreEvent(gameId, playerId, 'I')
      await createTestScoreEvent(gameId, playerId, 'X')

      const response = await invokeFunction(tournamentResultsHandler, {
        httpMethod: 'GET',
        path: `/api/tournaments/${tournamentId}/results`,
        // No auth headers
      })

      assertSuccess(response)
      expect(response.body).toBeDefined()
      expect(typeof response.body).toBe('object')
    })

    it('should include player information in tournament results', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })


      const gameId = await createTestGame(tournamentId)
      await createTestScoreEvent(gameId, playerId, 'I')

      const response = await invokeFunction(tournamentResultsHandler, {
        httpMethod: 'GET',
        path: `/api/tournaments/${tournamentId}/results`,
      })

      assertSuccess(response)
      const results = response.body as Record<string, any>
      expect(results[playerId]).toBeDefined()
      expect(results[playerId]).toHaveProperty('player')
      expect(results[playerId].player).toHaveProperty('id', playerId)
      expect(results[playerId].player).toHaveProperty('name', 'Test Player')
      expect(results[playerId].player).toHaveProperty('nickname', 'TP')
      expect(results[playerId].player).toHaveProperty('avatar')
    })

    it('should return 400 for missing tournament ID', async () => {
      const response = await invokeFunction(tournamentResultsHandler, {
        httpMethod: 'GET',
        path: '/api/tournaments//results',
      })

      assertError(response, 400)
    })
  })

  describe('GET /api/results/yearly/:year (Public)', () => {
    it('should return yearly results without authentication', async () => {
      const currentYear = new Date().getFullYear()
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })


      const gameId = await createTestGame(tournamentId)
      await createTestScoreEvent(gameId, playerId, 'I')
      await createTestScoreEvent(gameId, playerId, 'X')

      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: `/api/results/yearly/${currentYear}`,
        // No auth headers
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('year', currentYear)
      expect(response.body).toHaveProperty('scores')
      expect(Array.isArray((response.body as { scores?: unknown[] }).scores)).toBe(true)
    })

    it('should include player information in yearly results', async () => {
      const currentYear = new Date().getFullYear()
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Yearly Player', nickname: 'YP' })


      const gameId = await createTestGame(tournamentId)
      await createTestScoreEvent(gameId, playerId, 'I')

      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: `/api/results/yearly/${currentYear}`,
      })

      assertSuccess(response)
      const body = response.body as { year: number; scores: Array<{ playerId: string; player: any }> }
      expect(body.scores.length).toBeGreaterThan(0)
      const playerScore = body.scores.find((s) => s.playerId === playerId)
      expect(playerScore).toBeDefined()
      expect(playerScore?.player).toBeDefined()
      expect(playerScore?.player).toHaveProperty('id', playerId)
      expect(playerScore?.player).toHaveProperty('name', 'Yearly Player')
      expect(playerScore?.player).toHaveProperty('nickname', 'YP')
      expect(playerScore?.player).toHaveProperty('avatar')
    })

    it('should return empty scores for year with no games', async () => {
      const futureYear = new Date().getFullYear() + 10

      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: `/api/results/yearly/${futureYear}`,
      })

      assertSuccess(response)
      expect((response.body as { scores?: unknown[] }).scores?.length || 0).toBe(0)
    })

    it('should return 400 for invalid year', async () => {
      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: '/api/results/yearly/invalid',
      })

      assertError(response, 400)
    })
  })

  describe('GET /api/games/:id (Public)', () => {
    it('should return game without authentication', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })


      const gameId = await createTestGame(tournamentId)
      await createTestScoreEvent(gameId, playerId, 'I')
      await createTestScoreEvent(gameId, playerId, 'X')

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'GET',
        path: `/api/games/${gameId}`,
        // No auth headers
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('id', gameId)
      expect(response.body).toHaveProperty('events')
      expect(Array.isArray((response.body as { events?: unknown[] }).events)).toBe(true)
    })

    it('should include player information in game events', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Game Player', nickname: 'GP' })


      const gameId = await createTestGame(tournamentId)
      await createTestScoreEvent(gameId, playerId, 'I')

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'GET',
        path: `/api/games/${gameId}`,
      })

      assertSuccess(response)
      const body = response.body as { events: Array<{ playerId: string; player: any }> }
      expect(body.events.length).toBeGreaterThan(0)
      const event = body.events[0]
      expect(event).toHaveProperty('player')
      expect(event.player).toBeDefined()
      expect(event.player).toHaveProperty('id', playerId)
      expect(event.player).toHaveProperty('name', 'Game Player')
      expect(event.player).toHaveProperty('nickname', 'GP')
      expect(event.player).toHaveProperty('avatar')
    })

    it('should return 404 if game not found', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000'

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'GET',
        path: `/api/games/${nonExistentId}`,
      })

      assertError(response, 404)
    })
  })

  describe('DELETE /api/games/:id (Protected)', () => {
    it('should require authentication for DELETE', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })
      const gameId = await createTestGame(tournamentId)

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'DELETE',
        path: `/api/games/${gameId}`,
        // No auth headers
      })

      assertError(response, 401)
    })

    it('should allow DELETE with authentication', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })
      const gameId = await createTestGame(tournamentId)

      const response = await invokeFunction(gameHandler, {
        httpMethod: 'DELETE',
        path: `/api/games/${gameId}`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
    })
  })

  describe('Data Integrity', () => {
    it('should return same data structure for public and authenticated requests', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })


      const gameId = await createTestGame(tournamentId)
      await createTestScoreEvent(gameId, playerId, 'I')

      const publicResponse = await invokeFunction(tournamentResultsHandler, {
        httpMethod: 'GET',
        path: `/api/tournaments/${tournamentId}/results`,
      })

      const authResponse = await invokeFunction(tournamentResultsHandler, {
        httpMethod: 'GET',
        path: `/api/tournaments/${tournamentId}/results`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(publicResponse)
      assertSuccess(authResponse)

      // Both should have the same structure
      expect(publicResponse.body).toEqual(authResponse.body)
    })
  })
})
