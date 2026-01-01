import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, assertError, getTestAdminPassword } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import { createTestPlayer, cleanupTestData } from './test-data'
import { handler as playersHandler } from '../../netlify/functions/players/index'
import { handler as playerHandler } from '../../netlify/functions/players/[id]'

describe('Players Integration Tests', () => {
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

    // Get auth token for protected endpoints
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

  describe('GET /api/players', () => {
    it('should return empty array when no players exist', async () => {
      const response = await invokeFunction(playersHandler, {
        httpMethod: 'GET',
        path: '/api/players',
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(Array.isArray(response.body)).toBe(true)
      expect((response.body as unknown[]).length).toBe(0)
    })

    it('should return list of players', async () => {
      await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
      await createTestPlayer({ name: 'Player 2', nickname: 'P2' })

      const response = await invokeFunction(playersHandler, {
        httpMethod: 'GET',
        path: '/api/players',
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(Array.isArray(response.body)).toBe(true)
      expect((response.body as unknown[]).length).toBe(2)
    })

    it('should require authentication', async () => {
      const response = await invokeFunction(playersHandler, {
        httpMethod: 'GET',
        path: '/api/players',
      })

      assertError(response, 401)
    })

    it('should exclude deleted players', async () => {
      const playerId = await createTestPlayer({ name: 'Active Player', nickname: 'AP' })
      const deletedPlayerId = await createTestPlayer({ name: 'Deleted Player', nickname: 'DP' })

      // Soft delete the second player
      const pool = (await import('./db-test-setup')).getTestDbPool()
      await pool.query('UPDATE players SET deleted_at = NOW() WHERE id = $1', [deletedPlayerId])

      const response = await invokeFunction(playersHandler, {
        httpMethod: 'GET',
        path: '/api/players',
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      const players = response.body as Array<{ id: string; name: string }>
      expect(players.length).toBe(1)
      expect(players[0].id).toBe(playerId)
    })
  })

  describe('POST /api/players', () => {
    it('should create a new player', async () => {
      const response = await invokeFunction(playersHandler, {
        httpMethod: 'POST',
        path: '/api/players',
        body: {
          name: 'New Player',
          nickname: 'NP',
        },
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.statusCode).toBe(201)
      expect(response.body).toHaveProperty('id')
      expect(response.body).toHaveProperty('name', 'New Player')
      expect(response.body).toHaveProperty('nickname', 'NP')
    })

    it('should create player with avatar', async () => {
      const avatarBase64 = Buffer.from('test-avatar-data').toString('base64')

      const response = await invokeFunction(playersHandler, {
        httpMethod: 'POST',
        path: '/api/players',
        body: {
          name: 'Player With Avatar',
          nickname: 'PWA',
          avatar: avatarBase64,
        },
        headers: createAuthHeaders(authToken),
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('avatar')
      expect((response.body as { avatar?: string }).avatar).toBe(avatarBase64)
    })

    it('should return 400 when name is missing', async () => {
      const response = await invokeFunction(playersHandler, {
        httpMethod: 'POST',
        path: '/api/players',
        body: {
          nickname: 'NP',
        },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
      expect(response.body).toHaveProperty('error')
    })

    it('should return 400 when nickname is missing', async () => {
      const response = await invokeFunction(playersHandler, {
        httpMethod: 'POST',
        path: '/api/players',
        body: {
          name: 'New Player',
        },
        headers: createAuthHeaders(authToken),
      })

      assertError(response, 400)
      expect(response.body).toHaveProperty('error')
    })

    it('should require authentication', async () => {
      const response = await invokeFunction(playersHandler, {
        httpMethod: 'POST',
        path: '/api/players',
        body: {
          name: 'New Player',
          nickname: 'NP',
        },
      })

      assertError(response, 401)
    })
  })

  describe('PUT /api/players/:id', () => {
    it('should update player', async () => {
      const playerId = await createTestPlayer({ name: 'Original Name', nickname: 'ON' })

      const response = await invokeFunction(playerHandler, {
        httpMethod: 'PUT',
        path: `/api/players/${playerId}`,
        body: {
          name: 'Updated Name',
          nickname: 'UN',
        },
        headers: createAuthHeaders(authToken),
        queryStringParameters: { id: playerId },
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('name', 'Updated Name')
      expect(response.body).toHaveProperty('nickname', 'UN')
    })

    it('should require authentication', async () => {
      const playerId = await createTestPlayer()

      const response = await invokeFunction(playerHandler, {
        httpMethod: 'PUT',
        path: `/api/players/${playerId}`,
        body: {
          name: 'Updated Name',
        },
        queryStringParameters: { id: playerId },
      })

      assertError(response, 401)
    })
  })

  describe('DELETE /api/players/:id', () => {
    it('should soft delete player', async () => {
      const playerId = await createTestPlayer({ name: 'To Delete', nickname: 'TD' })

      const response = await invokeFunction(playerHandler, {
        httpMethod: 'DELETE',
        path: `/api/players/${playerId}`,
        headers: createAuthHeaders(authToken),
        queryStringParameters: { id: playerId },
      })

      assertSuccess(response)

      // Verify player is soft deleted
      const pool = (await import('./db-test-setup')).getTestDbPool()
      const result = await pool.query(
        'SELECT deleted_at FROM players WHERE id = $1',
        [playerId]
      )
      expect(result.rows[0].deleted_at).not.toBeNull()
    })

    it('should require authentication', async () => {
      const playerId = await createTestPlayer()

      const response = await invokeFunction(playerHandler, {
        httpMethod: 'DELETE',
        path: `/api/players/${playerId}`,
        queryStringParameters: { id: playerId },
      })

      assertError(response, 401)
    })
  })
})
