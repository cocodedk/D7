import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, assertError, generateNonExistentId, getTestAdminPassword } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import { createTestTournament, cleanupTestData } from './test-data'
import { handler as tournamentsHandler } from '../../netlify/functions/tournaments/index'
import { handler as activeHandler } from '../../netlify/functions/tournaments/active'
import { handler as startHandler } from '../../netlify/functions/tournaments/[id]/start'
import { handler as closeHandler } from '../../netlify/functions/tournaments/[id]/close'
import { handler as resultsHandler } from '../../netlify/functions/tournaments/[id]/results'

describe('Tournaments Integration Tests', () => {
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

  afterEach(async () => {
    await cleanupTestData()
  })

  describe('GET /api/tournaments', () => {
    it('should return empty array when no tournaments exist', async () => {
      const response = await invokeFunction(tournamentsHandler, {
        httpMethod: 'GET',
        path: '/api/tournaments',
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(Array.isArray(response.body)).toBe(true)
      expect((response.body as unknown[]).length).toBe(0)
    })

    it('should return list of tournaments', async () => {
      await createTestTournament({ date: '2024-01-01', state: 'draft' })
      await createTestTournament({ date: '2024-01-02', state: 'active' })

      const response = await invokeFunction(tournamentsHandler, {
        httpMethod: 'GET',
        path: '/api/tournaments',
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(Array.isArray(response.body)).toBe(true)
      expect((response.body as unknown[]).length).toBe(2)
    })

    it('should require authentication', async () => {
      const response = await invokeFunction(tournamentsHandler, {
        httpMethod: 'GET',
        path: '/api/tournaments',
      })

      assertError(response, 401)
    })
  })

  describe('POST /api/tournaments', () => {
    it('should create a new tournament in draft state', async () => {
      const response = await invokeFunction(tournamentsHandler, {
        httpMethod: 'POST',
        path: '/api/tournaments',
        body: { date: '2024-01-15' },
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.statusCode).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('date', '2024-01-15')
      expect(response.body).toHaveProperty('state', 'draft')
    })

    it('should return 400 when date is missing', async () => {
      const response = await invokeFunction(tournamentsHandler, {
        httpMethod: 'POST',
        path: '/api/tournaments',
        body: {},
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 409 when tournament with same date already exists', async () => {
      const date = '2024-01-15'
      await createTestTournament({ date, state: 'draft' })

      const response = await invokeFunction(tournamentsHandler, {
        httpMethod: 'POST',
        path: '/api/tournaments',
        body: { date },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 409)
      expect(response.body).toHaveProperty('error')
      expect((response.body as { error?: string }).error).toContain('already exists')
    })

    it('should require authentication', async () => {
      const response = await invokeFunction(tournamentsHandler, {
        httpMethod: 'POST',
        path: '/api/tournaments',
        body: { date: '2024-01-15' },
      })

      assertError(response, 401)
    })
  })

  describe('GET /api/tournaments/active', () => {
    it('should return null when no active tournament', async () => {
      const response = await invokeFunction(activeHandler, {
        httpMethod: 'GET',
        path: '/api/tournaments/active',
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.body).toBeNull()
    })

    it('should return active tournament', async () => {
      const tournamentId = await createTestTournament({ date: '2024-01-15', state: 'active' })

      // Small delay to ensure tournament is committed
      await new Promise(resolve => setTimeout(resolve, 50))

      const response = await invokeFunction(activeHandler, {
        httpMethod: 'GET',
        path: '/api/tournaments/active',
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.body).not.toBeNull()
      expect((response.body as { state?: string }).state).toBe('active')
    })

    it('should require authentication', async () => {
      const response = await invokeFunction(activeHandler, {
        httpMethod: 'GET',
        path: '/api/tournaments/active',
      })

      assertError(response, 401)
    })
  })

  describe('PUT /api/tournaments/:id/start', () => {
    it('should start a draft tournament', async () => {
      // Ensure no active tournament exists first
      const pool = (await import('./db-test-setup')).getTestDbPool()
      await pool.query("UPDATE tournaments SET state = 'draft' WHERE state = 'active'")

      const tournamentId = await createTestTournament({
        date: '2024-01-15',
        state: 'draft',
      })

      // Small delay to ensure tournament is committed
      await new Promise(resolve => setTimeout(resolve, 50))

      const response = await invokeFunction(startHandler, {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournamentId}/start`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect((response.body as { state?: string }).state).toBe('active')
      expect((response.body as { started_at?: string }).started_at).not.toBeNull()
    })

    it('should return 400 if another tournament is active', async () => {
      const activeId = await createTestTournament({ date: '2024-01-15', state: 'active' })
      const draftId = await createTestTournament({
        date: '2024-01-16',
        state: 'draft',
      })

      // Small delay to ensure tournaments are committed
      await new Promise(resolve => setTimeout(resolve, 50))

      const response = await invokeFunction(startHandler, {
        httpMethod: 'PUT',
        path: `/api/tournaments/${draftId}/start`,
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 404 if tournament not found or not in draft', async () => {
      const response = await invokeFunction(startHandler, {
        httpMethod: 'PUT',
        path: `/api/tournaments/${generateNonExistentId()}/start`,
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 404)
    })

    it('should require authentication', async () => {
      const tournamentId = await createTestTournament({ state: 'draft' })

      const response = await invokeFunction(startHandler, {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournamentId}/start`,
      })

      assertError(response, 401)
    })
  })

  describe('PUT /api/tournaments/:id/close', () => {
    it('should close an active tournament', async () => {
      const tournamentDate = '2024-01-15'
      const tournamentId = await createTestTournament({
        date: tournamentDate,
        state: 'active',
      })

      // Small delay to ensure tournament is committed
      await new Promise(resolve => setTimeout(resolve, 50))

      const response = await invokeFunction(closeHandler, {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournamentId}/close`,
        body: { confirmation: tournamentDate },
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect((response.body as { state?: string }).state).toBe('closed')
      expect((response.body as { closed_at?: string }).closed_at).not.toBeNull()
    })

    it('should return 400 if confirmation date does not match', async () => {
      const tournamentId = await createTestTournament({
        date: '2024-01-15',
        state: 'active',
      })

      // Small delay to ensure tournament is committed
      await new Promise(resolve => setTimeout(resolve, 50))

      const response = await invokeFunction(closeHandler, {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournamentId}/close`,
        body: { confirmation: '2024-01-16' },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
    })

    it('should return 404 if tournament not found or not active', async () => {
      const response = await invokeFunction(closeHandler, {
        httpMethod: 'PUT',
        path: `/api/tournaments/${generateNonExistentId()}/close`,
        body: { confirmation: 'Test' },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 404)
    })

    it('should require authentication', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })

      const response = await invokeFunction(closeHandler, {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournamentId}/close`,
        body: { confirmation: '2024-01-15' },
      })

      assertError(response, 401)
    })
  })

  describe('GET /api/tournaments/:id/results', () => {
    it('should return tournament results', async () => {
      const tournamentId = await createTestTournament({ state: 'active' })

      const response = await invokeFunction(resultsHandler, {
        httpMethod: 'GET',
        path: `/api/tournaments/${tournamentId}/results`,
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      // Results handler returns an object mapping player IDs to scores, not an array
      expect(response.body).toBeDefined()
      expect(typeof response.body).toBe('object')
      expect(response.body).not.toBeNull()
    })

    it('should require authentication', async () => {
      const tournamentId = await createTestTournament()

      const response = await invokeFunction(resultsHandler, {
        httpMethod: 'GET',
        path: `/api/tournaments/${tournamentId}/results`,
      })

      assertError(response, 401)
    })
  })
})
