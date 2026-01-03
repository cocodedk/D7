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
import { handler as yearlyResultsHandler } from '../../netlify/functions/results/yearly/[year]'

describe('Results Integration Tests', () => {
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
    // Delete NETLIFY_DATABASE_URL first (it takes priority), then set DATABASE_URL
    delete process.env.NETLIFY_DATABASE_URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    await resetTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/results/yearly/:year', () => {
    it('should return yearly results', async () => {
      const currentYear = new Date().getFullYear()
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })


      const gameId = await createTestGame(tournamentId)

      await createTestScoreEvent(gameId, playerId, 'I')
      await createTestScoreEvent(gameId, playerId, 'X')

      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: `/api/results/yearly/${currentYear}`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('year', currentYear)
      expect(response.body).toHaveProperty('scores')
      expect(Array.isArray((response.body as { scores?: unknown[] }).scores)).toBe(true)
    })

    it('should return empty scores for year with no games', async () => {
      const futureYear = new Date().getFullYear() + 10

      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: `/api/results/yearly/${futureYear}`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect((response.body as { scores?: unknown[] }).scores?.length || 0).toBe(0)
    })

    it('should return 400 for invalid year', async () => {
      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: '/api/results/yearly/invalid',
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
    })

    it('should include player information in yearly results', async () => {
      const currentYear = new Date().getFullYear()
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })

      await new Promise(resolve => setTimeout(resolve, 50))

      const gameId = await createTestGame(tournamentId)
      await new Promise(resolve => setTimeout(resolve, 50))
      await createTestScoreEvent(gameId, playerId, 'I')

      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: `/api/results/yearly/${currentYear}`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      const body = response.body as { year: number; scores: Array<{ playerId: string; player: any }> }
      expect(body.scores.length).toBeGreaterThan(0)
      const playerScore = body.scores.find((s) => s.playerId === playerId)
      expect(playerScore).toBeDefined()
      expect(playerScore?.player).toBeDefined()
      expect(playerScore?.player).toHaveProperty('id', playerId)
      expect(playerScore?.player).toHaveProperty('name', 'Test Player')
      expect(playerScore?.player).toHaveProperty('nickname', 'TP')
      expect(playerScore?.player).toHaveProperty('avatar')
    })
  })
})
