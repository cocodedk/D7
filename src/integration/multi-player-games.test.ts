import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import {
  createTestPlayer,
  createTestTournament,
  cleanupTestData,
} from './test-data'
import { handler as gamesHandler } from '../../netlify/functions/games/index'
import { handler as resultsHandler } from '../../netlify/functions/tournaments/[id]/results'

describe('Multi-Player Games E2E Tests', () => {
  let authToken: string
  let tournamentId: string

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
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should track scores for multiple players in same game', async () => {
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    const player3Id = await createTestPlayer({ name: 'Player 3', nickname: 'P3' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Create game with events for all three players
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'X' },
          { playerId: player2Id, type: 'X' },
          { playerId: player3Id, type: 'I' },
          { playerId: player3Id, type: 'I' },
          { playerId: player3Id, type: 'I' },
          { playerId: player3Id, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const resultsResponse = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsResponse)
    const scores = resultsResponse.body as Record<string, {
      plusRemainder: number
      minusRemainder: number
      plusClusters: number
      minusClusters: number
      netScore: number
    }>

    // Player 1: 2 I events = 0 clusters, 2 remainder
    expect(scores[player1Id]).toBeDefined()
    expect(scores[player1Id].plusClusters).toBe(0)
    expect(scores[player1Id].plusRemainder).toBe(2)
    expect(scores[player1Id].netScore).toBe(0)

    // Player 2: 2 X events = 0 clusters, 2 remainder
    expect(scores[player2Id]).toBeDefined()
    expect(scores[player2Id].minusClusters).toBe(0)
    expect(scores[player2Id].minusRemainder).toBe(2)
    expect(scores[player2Id].netScore).toBe(0)

    // Player 3: 4 I events = 1 cluster, 0 remainder
    expect(scores[player3Id]).toBeDefined()
    expect(scores[player3Id].plusClusters).toBe(1)
    expect(scores[player3Id].plusRemainder).toBe(0)
    expect(scores[player3Id].netScore).toBe(1)
  })

  it('should track scores correctly when same player has multiple events', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Create game with multiple events for same player
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'X' },
          { playerId, type: 'X' },
          { playerId, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const resultsResponse = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsResponse)
    const scores = resultsResponse.body as Record<string, {
      plusRemainder: number
      minusRemainder: number
      plusClusters: number
      minusClusters: number
      netScore: number
    }>

    // 4 I events = 1 cluster, 0 remainder
    // 2 X events = 0 clusters, 2 remainder
    expect(scores[playerId].plusClusters).toBe(1)
    expect(scores[playerId].plusRemainder).toBe(0)
    expect(scores[playerId].minusClusters).toBe(0)
    expect(scores[playerId].minusRemainder).toBe(2)
    expect(scores[playerId].netScore).toBe(1)
  })

  it('should aggregate scores across multiple games for multiple players', async () => {
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Game 1: Player 1 gets 3 I, Player 2 gets 1 X
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'X' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Game 2: Player 1 gets 2 I, Player 2 gets 4 X
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'X' },
          { playerId: player2Id, type: 'X' },
          { playerId: player2Id, type: 'X' },
          { playerId: player2Id, type: 'X' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const resultsResponse = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsResponse)
    const scores = resultsResponse.body as Record<string, {
      plusRemainder: number
      minusRemainder: number
      plusClusters: number
      minusClusters: number
      netScore: number
    }>

    // Player 1: 5 I total = 1 cluster + 1 remainder
    expect(scores[player1Id].plusClusters).toBe(1)
    expect(scores[player1Id].plusRemainder).toBe(1)
    expect(scores[player1Id].netScore).toBe(1)

    // Player 2: 5 X total = 1 cluster + 1 remainder
    expect(scores[player2Id].minusClusters).toBe(1)
    expect(scores[player2Id].minusRemainder).toBe(1)
    expect(scores[player2Id].netScore).toBe(-1)
  })

  it('should include all players in tournament results', async () => {
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    const player3Id = await createTestPlayer({ name: 'Player 3', nickname: 'P3' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Create games with events for all players
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'I' },
          { playerId: player3Id, type: 'X' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const resultsResponse = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsResponse)
    const scores = resultsResponse.body as Record<string, {
      plusRemainder: number
      minusRemainder: number
      plusClusters: number
      minusClusters: number
      netScore: number
    }>

    // All three players should be in results
    expect(scores[player1Id]).toBeDefined()
    expect(scores[player2Id]).toBeDefined()
    expect(scores[player3Id]).toBeDefined()

    // Verify each has correct structure
    expect(scores[player1Id]).toHaveProperty('plusRemainder')
    expect(scores[player1Id]).toHaveProperty('minusRemainder')
    expect(scores[player1Id]).toHaveProperty('plusClusters')
    expect(scores[player1Id]).toHaveProperty('minusClusters')
    expect(scores[player1Id]).toHaveProperty('netScore')
  })

  it('should handle game with many events for multiple players', async () => {
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Create game with many events (20 total)
    const events = []
    for (let i = 0; i < 10; i++) {
      events.push({ playerId: player1Id, type: 'I' as const })
      events.push({ playerId: player2Id, type: 'X' as const })
    }

    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events,
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    const resultsResponse = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsResponse)
    const scores = resultsResponse.body as Record<string, {
      plusRemainder: number
      minusRemainder: number
      plusClusters: number
      minusClusters: number
      netScore: number
    }>

    // Player 1: 10 I = 2 clusters + 2 remainder
    expect(scores[player1Id].plusClusters).toBe(2)
    expect(scores[player1Id].plusRemainder).toBe(2)
    expect(scores[player1Id].netScore).toBe(2)

    // Player 2: 10 X = 2 clusters + 2 remainder
    expect(scores[player2Id].minusClusters).toBe(2)
    expect(scores[player2Id].minusRemainder).toBe(2)
    expect(scores[player2Id].netScore).toBe(-2)
  })
})
