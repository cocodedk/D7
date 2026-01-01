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
import { handler as resultsHandler } from '../../netlify/functions/tournaments/[id]/results'
import { calculatePlayerScore, type ScoreEvent } from '../../netlify/functions/_shared/scoring'

describe('Scoring Accuracy E2E Tests', () => {
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
    await new Promise(resolve => setTimeout(resolve, 50))
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should calculate correct scores for simple events', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Record 4 I events (should form 1 cluster)
    await invokeFunction(gamesHandler, {
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

    expect(scores[playerId]).toBeDefined()
    expect(scores[playerId].plusClusters).toBe(1)
    expect(scores[playerId].plusRemainder).toBe(0)
    expect(scores[playerId].minusClusters).toBe(0)
    expect(scores[playerId].minusRemainder).toBe(0)
    expect(scores[playerId].netScore).toBe(1)
  })

  it('should calculate correct scores with remainders', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Record 5 I events (1 cluster + 1 remainder)
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'I' },
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

    expect(scores[playerId].plusClusters).toBe(1)
    expect(scores[playerId].plusRemainder).toBe(1)
    expect(scores[playerId].netScore).toBe(1)
  })

  it('should calculate correct scores with mixed I and X events', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Record 4 I and 4 X events (1 plus cluster, 1 minus cluster, net = 0)
    await invokeFunction(gamesHandler, {
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
          { playerId, type: 'X' },
          { playerId, type: 'X' },
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

    expect(scores[playerId].plusClusters).toBe(1)
    expect(scores[playerId].minusClusters).toBe(1)
    expect(scores[playerId].plusRemainder).toBe(0)
    expect(scores[playerId].minusRemainder).toBe(0)
    expect(scores[playerId].netScore).toBe(0)
  })

  it('should calculate correct scores with carry-over across games', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // First game: 3 I events (0 clusters, 3 remainder)
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Second game: 2 I events (should form 1 cluster with carry-over: 3 + 2 = 5 = 1 cluster + 1 remainder)
    await invokeFunction(gamesHandler, {
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

    // Total: 5 I events = 1 cluster + 1 remainder
    expect(scores[playerId].plusClusters).toBe(1)
    expect(scores[playerId].plusRemainder).toBe(1)
    expect(scores[playerId].netScore).toBe(1)
  })

  it('should match scoring engine calculations exactly', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Create complex scenario: 7 I, 3 X events
    const events: ScoreEvent[] = [
      { playerId, type: 'I' },
      { playerId, type: 'I' },
      { playerId, type: 'I' },
      { playerId, type: 'I' },
      { playerId, type: 'I' },
      { playerId, type: 'I' },
      { playerId, type: 'I' },
      { playerId, type: 'X' },
      { playerId, type: 'X' },
      { playerId, type: 'X' },
    ]

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
    const apiScores = resultsResponse.body as Record<string, {
      plusRemainder: number
      minusRemainder: number
      plusClusters: number
      minusClusters: number
      netScore: number
    }>

    // Calculate expected scores using scoring engine
    const expectedScore = calculatePlayerScore(events)

    expect(apiScores[playerId].plusClusters).toBe(expectedScore.plusClusters)
    expect(apiScores[playerId].plusRemainder).toBe(expectedScore.plusRemainder)
    expect(apiScores[playerId].minusClusters).toBe(expectedScore.minusClusters)
    expect(apiScores[playerId].minusRemainder).toBe(expectedScore.minusRemainder)
    expect(apiScores[playerId].netScore).toBe(expectedScore.netScore)

    // Verify: 7 I = 1 cluster + 3 remainder, 3 X = 0 clusters + 3 remainder, net = 1
    expect(apiScores[playerId].plusClusters).toBe(1)
    expect(apiScores[playerId].plusRemainder).toBe(3)
    expect(apiScores[playerId].minusClusters).toBe(0)
    expect(apiScores[playerId].minusRemainder).toBe(3)
    expect(apiScores[playerId].netScore).toBe(1)
  })

  it('should handle edge case: exactly 4 events forming cluster', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Record exactly 4 X events (should form 1 minus cluster)
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId, type: 'X' },
          { playerId, type: 'X' },
          { playerId, type: 'X' },
          { playerId, type: 'X' },
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

    expect(scores[playerId].minusClusters).toBe(1)
    expect(scores[playerId].minusRemainder).toBe(0)
    expect(scores[playerId].plusClusters).toBe(0)
    expect(scores[playerId].plusRemainder).toBe(0)
    expect(scores[playerId].netScore).toBe(-1)
  })
})
