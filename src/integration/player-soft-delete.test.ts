import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, getTestAdminPassword } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import {
  createTestPlayer,
  createTestTournament,
  cleanupTestData,
} from './test-data'
import { handler as playersHandler } from '../../netlify/functions/players/index'
import { handler as playerHandler } from '../../netlify/functions/players/[id]'
import { handler as gamesHandler } from '../../netlify/functions/games/index'
import { handler as resultsHandler } from '../../netlify/functions/tournaments/[id]/results'
import { handler as yearlyResultsHandler } from '../../netlify/functions/results/yearly/[year]'

describe('Player Soft-Delete Impact E2E Tests', () => {
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

  it('should exclude soft-deleted players from players list', async () => {
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    const player3Id = await createTestPlayer({ name: 'Player 3', nickname: 'P3' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify all players appear in list
    const listBefore = await invokeFunction(playersHandler, {
      httpMethod: 'GET',
      path: '/api/players',
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(listBefore)
    const playersBefore = listBefore.body as Array<{ id: string }>
    expect(playersBefore.length).toBe(3)
    expect(playersBefore.map(p => p.id)).toContain(player1Id)
    expect(playersBefore.map(p => p.id)).toContain(player2Id)
    expect(playersBefore.map(p => p.id)).toContain(player3Id)

    // Soft-delete player2
    await invokeFunction(playerHandler, {
      httpMethod: 'DELETE',
      path: `/api/players/${player2Id}`,
      headers: createAuthHeaders(authToken),
      queryStringParameters: { id: player2Id },
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify player2 no longer appears in list
    const listAfter = await invokeFunction(playersHandler, {
      httpMethod: 'GET',
      path: '/api/players',
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(listAfter)
    const playersAfter = listAfter.body as Array<{ id: string }>
    expect(playersAfter.length).toBe(2)
    expect(playersAfter.map(p => p.id)).toContain(player1Id)
    expect(playersAfter.map(p => p.id)).toContain(player3Id)
    expect(playersAfter.map(p => p.id)).not.toContain(player2Id)
  })

  it('should preserve soft-deleted player scores in tournament results', async () => {
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Record games with scores for both players
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
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

    // Verify both players appear in tournament results
    const resultsBefore = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsBefore)
    const scoresBefore = resultsBefore.body as Record<string, {
      plusClusters: number
      minusClusters: number
      netScore: number
    }>
    expect(scoresBefore[player1Id]).toBeDefined()
    expect(scoresBefore[player2Id]).toBeDefined()
    expect(scoresBefore[player1Id].netScore).toBe(1)
    expect(scoresBefore[player2Id].netScore).toBe(-1)

    // Soft-delete player2
    await invokeFunction(playerHandler, {
      httpMethod: 'DELETE',
      path: `/api/players/${player2Id}`,
      headers: createAuthHeaders(authToken),
      queryStringParameters: { id: player2Id },
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify player2 scores still appear in tournament results
    const resultsAfter = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsAfter)
    const scoresAfter = resultsAfter.body as Record<string, {
      plusClusters: number
      minusClusters: number
      netScore: number
    }>
    expect(scoresAfter[player1Id]).toBeDefined()
    expect(scoresAfter[player2Id]).toBeDefined()
    expect(scoresAfter[player1Id].netScore).toBe(1)
    expect(scoresAfter[player2Id].netScore).toBe(-1)
  })

  it('should preserve soft-deleted player scores in yearly results', async () => {
    const currentYear = new Date().getFullYear()
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Record games with scores
    await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'I' },
          { playerId: player2Id, type: 'I' },
          { playerId: player2Id, type: 'I' },
          { playerId: player2Id, type: 'I' },
        ],
      },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify both players appear in yearly results
    const yearlyBefore = await invokeFunction(yearlyResultsHandler, {
      httpMethod: 'GET',
      path: `/api/results/yearly/${currentYear}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(yearlyBefore)
    const scoresBefore = yearlyBefore.body as {
      year: number
      scores: Array<{ playerId: string; netScore: number }>
    }
    expect(scoresBefore.scores.length).toBe(2)
    const player1ScoreBefore = scoresBefore.scores.find(s => s.playerId === player1Id)
    const player2ScoreBefore = scoresBefore.scores.find(s => s.playerId === player2Id)
    expect(player1ScoreBefore).toBeDefined()
    expect(player2ScoreBefore).toBeDefined()
    expect(player2ScoreBefore!.netScore).toBe(1) // 4 I = 1 cluster

    // Soft-delete player2
    await invokeFunction(playerHandler, {
      httpMethod: 'DELETE',
      path: `/api/players/${player2Id}`,
      headers: createAuthHeaders(authToken),
      queryStringParameters: { id: player2Id },
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify player2 scores still appear in yearly results
    const yearlyAfter = await invokeFunction(yearlyResultsHandler, {
      httpMethod: 'GET',
      path: `/api/results/yearly/${currentYear}`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(yearlyAfter)
    const scoresAfter = yearlyAfter.body as {
      year: number
      scores: Array<{ playerId: string; netScore: number }>
    }
    expect(scoresAfter.scores.length).toBe(2)
    const player2ScoreAfter = scoresAfter.scores.find(s => s.playerId === player2Id)
    expect(player2ScoreAfter).toBeDefined()
    expect(player2ScoreAfter!.netScore).toBe(1)
  })

  it('should verify soft-delete sets deleted_at timestamp', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Soft-delete player
    await invokeFunction(playerHandler, {
      httpMethod: 'DELETE',
      path: `/api/players/${playerId}`,
      headers: createAuthHeaders(authToken),
      queryStringParameters: { id: playerId },
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify deleted_at is set in database
    const pool = (await import('./db-test-setup')).getTestDbPool()
    const result = await pool.query(
      'SELECT deleted_at FROM players WHERE id = $1',
      [playerId]
    )
    expect(result.rows.length).toBe(1)
    expect(result.rows[0].deleted_at).not.toBeNull()
  })

  it('should allow recording games for players before soft-delete', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Record game before soft-delete
    const gameBeforeResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [{ playerId, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(gameBeforeResponse)

    await new Promise(resolve => setTimeout(resolve, 50))

    // Soft-delete player
    await invokeFunction(playerHandler, {
      httpMethod: 'DELETE',
      path: `/api/players/${playerId}`,
      headers: createAuthHeaders(authToken),
      queryStringParameters: { id: playerId },
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Verify game still exists and scores are preserved
    const resultsResponse = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(resultsResponse)
    const scores = resultsResponse.body as Record<string, {
      plusRemainder: number
      netScore: number
    }>
    expect(scores[playerId]).toBeDefined()
    expect(scores[playerId].plusRemainder).toBe(1)
  })
})
