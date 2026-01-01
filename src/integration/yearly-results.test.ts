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
import { handler as yearlyResultsHandler } from '../../netlify/functions/results/yearly/[year]'

describe('Yearly Results Aggregation E2E Tests', () => {
  let authToken: string

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
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should aggregate results across multiple tournaments in same year', async () => {
    const currentYear = new Date().getFullYear()
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Create first tournament in current year
    const tournament1Id = await createTestTournament({
      date: `${currentYear}-01-15`,
      state: 'active',
    })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Record game in first tournament
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: tournament1Id,
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

    // Close first tournament
    await invokeFunction(
      (await import('../../netlify/functions/tournaments/[id]/close')).handler,
      {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournament1Id}/close`,
        body: { confirmation: `${currentYear}-01-15` },
        headers: createAuthHeaders(authToken),
      }
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    // Create and start second tournament in same year
    const tournament2Id = await createTestTournament({
      date: `${currentYear}-06-15`,
      state: 'draft',
    })
    await new Promise(resolve => setTimeout(resolve, 50))

    await invokeFunction(
      (await import('../../netlify/functions/tournaments/[id]/start')).handler,
      {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournament2Id}/start`,
        headers: createAuthHeaders(authToken),
      }
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    // Record game in second tournament
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: tournament2Id,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Get yearly results
    const resultsResponse = await invokeFunction(yearlyResultsHandler, {
      httpMethod: 'GET',
      path: `/api/results/yearly/${currentYear}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsResponse)
    const results = resultsResponse.body as {
      year: number
      scores: Array<{
        playerId: string
        plusRemainder: number
        minusRemainder: number
        plusClusters: number
        minusClusters: number
        netScore: number
      }>
    }

    expect(results.year).toBe(currentYear)
    expect(results.scores.length).toBe(1)
    expect(results.scores[0].playerId).toBe(playerId)

    // Total: 6 I events = 1 cluster + 2 remainder
    expect(results.scores[0].plusClusters).toBe(1)
    expect(results.scores[0].plusRemainder).toBe(2)
    expect(results.scores[0].netScore).toBe(1)
  })

  it('should separate results by year', async () => {
    const currentYear = new Date().getFullYear()
    const nextYear = currentYear + 1
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Create tournament in current year
    const tournament1Id = await createTestTournament({
      date: `${currentYear}-01-15`,
      state: 'active',
    })
    await new Promise(resolve => setTimeout(resolve, 50))

    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: tournament1Id,
        events: [{ playerId, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Close first tournament
    await invokeFunction(
      (await import('../../netlify/functions/tournaments/[id]/close')).handler,
      {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournament1Id}/close`,
        body: { confirmation: `${currentYear}-01-15` },
        headers: createAuthHeaders(authToken),
      }
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    // Create tournament in next year
    const tournament2Id = await createTestTournament({
      date: `${nextYear}-01-15`,
      state: 'draft',
    })
    await new Promise(resolve => setTimeout(resolve, 50))

    await invokeFunction(
      (await import('../../netlify/functions/tournaments/[id]/start')).handler,
      {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournament2Id}/start`,
        headers: createAuthHeaders(authToken),
      }
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    const game2Response = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: tournament2Id,
        events: [
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'I' },
          { playerId, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(game2Response)
    const game2Id = (game2Response.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Set game2's created_at to next year (yearly results use g.created_at, not tournament date)
    const pool = (await import('./db-test-setup')).getTestDbPool()
    await pool.query(
      `UPDATE games SET created_at = $1 WHERE id = $2`,
      [`${nextYear}-01-15 12:00:00`, game2Id]
    )

    // Also update score_events created_at to match
    await pool.query(
      `UPDATE score_events SET created_at = $1 WHERE game_id = $2`,
      [`${nextYear}-01-15 12:00:00`, game2Id]
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    // Get current year results
    const currentYearResponse = await invokeFunction(yearlyResultsHandler, {
      httpMethod: 'GET',
      path: `/api/results/yearly/${currentYear}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(currentYearResponse)
    const currentYearResults = currentYearResponse.body as {
      year: number
      scores: Array<{ playerId: string; netScore: number }>
    }
    expect(currentYearResults.year).toBe(currentYear)
    expect(currentYearResults.scores.length).toBeGreaterThan(0)
    const currentYearPlayerScore = currentYearResults.scores.find(s => s.playerId === playerId)
    expect(currentYearPlayerScore).toBeDefined()
    expect(currentYearPlayerScore!.netScore).toBe(0) // 1 I = 0 clusters

    // Get next year results
    const nextYearResponse = await invokeFunction(yearlyResultsHandler, {
      httpMethod: 'GET',
      path: `/api/results/yearly/${nextYear}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(nextYearResponse)
    const nextYearResults = nextYearResponse.body as {
      year: number
      scores: Array<{ playerId: string; netScore: number }>
    }
    expect(nextYearResults.year).toBe(nextYear)
    expect(nextYearResults.scores.length).toBeGreaterThan(0)
    const nextYearPlayerScore = nextYearResults.scores.find(s => s.playerId === playerId)
    expect(nextYearPlayerScore).toBeDefined()
    expect(nextYearPlayerScore!.netScore).toBe(1) // 4 I = 1 cluster
  })

  it('should return empty scores for year with no games', async () => {
    const futureYear = new Date().getFullYear() + 10

    const response = await invokeFunction(yearlyResultsHandler, {
      httpMethod: 'GET',
      path: `/api/results/yearly/${futureYear}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(response)
    const results = response.body as {
      year: number
      scores: unknown[]
    }
    expect(results.year).toBe(futureYear)
    expect(results.scores.length).toBe(0)
  })

  it('should aggregate scores for multiple players across tournaments', async () => {
    const currentYear = new Date().getFullYear()
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Tournament 1
    const tournament1Id = await createTestTournament({
      date: `${currentYear}-01-15`,
      state: 'active',
    })
    await new Promise(resolve => setTimeout(resolve, 50))

    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: tournament1Id,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'X' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    await invokeFunction(
      (await import('../../netlify/functions/tournaments/[id]/close')).handler,
      {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournament1Id}/close`,
        body: { confirmation: `${currentYear}-01-15` },
        headers: createAuthHeaders(authToken),
      }
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    // Tournament 2
    const tournament2Id = await createTestTournament({
      date: `${currentYear}-06-15`,
      state: 'draft',
    })
    await new Promise(resolve => setTimeout(resolve, 50))

    await invokeFunction(
      (await import('../../netlify/functions/tournaments/[id]/start')).handler,
      {
        httpMethod: 'PUT',
        path: `/api/tournaments/${tournament2Id}/start`,
        headers: createAuthHeaders(authToken),
      }
    )

    await new Promise(resolve => setTimeout(resolve, 50))

    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: tournament2Id,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Get yearly results
    const resultsResponse = await invokeFunction(yearlyResultsHandler, {
      httpMethod: 'GET',
      path: `/api/results/yearly/${currentYear}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsResponse)
    const results = resultsResponse.body as {
      year: number
      scores: Array<{
        playerId: string
        plusRemainder: number
        minusRemainder: number
        plusClusters: number
        minusClusters: number
        netScore: number
      }>
    }

    expect(results.scores.length).toBe(2)

    // Player 1: 4 I total = 1 cluster
    const player1Score = results.scores.find(s => s.playerId === player1Id)
    expect(player1Score).toBeDefined()
    expect(player1Score!.plusClusters).toBe(1)
    expect(player1Score!.netScore).toBe(1)

    // Player 2: 1 I, 1 X total = 0 clusters, 1 I remainder, 1 X remainder
    const player2Score = results.scores.find(s => s.playerId === player2Id)
    expect(player2Score).toBeDefined()
    expect(player2Score!.plusClusters).toBe(0)
    expect(player2Score!.plusRemainder).toBe(1)
    expect(player2Score!.minusClusters).toBe(0)
    expect(player2Score!.minusRemainder).toBe(1)
    expect(player2Score!.netScore).toBe(0)
  })
})
