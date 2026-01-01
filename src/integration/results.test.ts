import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, assertError } from './test-helpers'
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
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/results/yearly/:year', () => {
    it('should return yearly results', async () => {
      const currentYear = new Date().getFullYear()
      const tournamentId = await createTestTournament({ state: 'active' })
      const playerId = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })

      // Small delay to ensure tournament is committed
      await new Promise(resolve => setTimeout(resolve, 50))

      const gameId = await createTestGame(tournamentId)

      // Small delay to ensure game is committed
      await new Promise(resolve => setTimeout(resolve, 50))
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

    it('should require authentication', async () => {
      const currentYear = new Date().getFullYear()

      const response = await invokeFunction(yearlyResultsHandler, {
        httpMethod: 'GET',
        path: `/api/results/yearly/${currentYear}`,
      })

      assertError(response, 401)
    })
  })
})
