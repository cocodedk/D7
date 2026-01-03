import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, assertError, getTestAdminPassword } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import {
  createTestPlayer,
  createTestTournament,
  cleanupTestData,
} from './test-data'
import { handler as tournamentsHandler } from '../../netlify/functions/tournaments/index'
import { handler as activeHandler } from '../../netlify/functions/tournaments-active'
import { handler as startHandler } from '../../netlify/functions/tournaments-start'
import { handler as closeHandler } from '../../netlify/functions/tournaments-close'
import { handler as gamesHandler } from '../../netlify/functions/games/index'
import { handler as resultsHandler } from '../../netlify/functions/tournaments-results'

describe('Tournament Lifecycle E2E Tests', () => {
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
    delete process.env.NETLIFY_DATABASE_URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    await resetTestDatabase()
  })

  afterEach(async () => {
    await cleanupTestData()
  })

  it('should complete full tournament lifecycle: create → start → record games → close → verify results', async () => {
    // Step 1: Create tournament in draft state
    const createResponse = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(createResponse)
    expect(createResponse.statusCode).toBe(201)
    const tournamentId = (createResponse.body as { id?: string }).id
    expect(tournamentId).toBeDefined()
    expect((createResponse.body as { state?: string }).state).toBe('draft')


    // Step 2: Verify no active tournament exists
    const activeBeforeResponse = await invokeFunction(activeHandler, {
      httpMethod: 'GET',
      path: '/api/tournaments/active',
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(activeBeforeResponse)
    expect(activeBeforeResponse.body).toBeNull()

    // Step 3: Start tournament (draft → active)
    const startResponse = await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournamentId}/start`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(startResponse)
    expect((startResponse.body as { state?: string }).state).toBe('active')
    expect((startResponse.body as { started_at?: string }).started_at).not.toBeNull()

    await new Promise(resolve => setTimeout(resolve, 50))

    // Step 4: Verify active tournament exists
    const activeAfterResponse = await invokeFunction(activeHandler, {
      httpMethod: 'GET',
      path: '/api/tournaments/active',
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(activeAfterResponse)
    expect(activeAfterResponse.body).not.toBeNull()
    expect((activeAfterResponse.body as { id?: string }).id).toBe(tournamentId)

    // Step 5: Create players
    const player1Id = await createTestPlayer({ name: 'Player 1', nickname: 'P1' })
    const player2Id = await createTestPlayer({ name: 'Player 2', nickname: 'P2' })
    await new Promise(resolve => setTimeout(resolve, 50))

    // Step 6: Record multiple games with score events
    const game1Response = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'X' },
        ],
        comment: 'First game',
      },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(game1Response)
    expect(game1Response.statusCode).toBe(201)

    await new Promise(resolve => setTimeout(resolve, 50))

    const game2Response = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [
          { playerId: player1Id, type: 'I' },
          { playerId: player1Id, type: 'I' },
          { playerId: player2Id, type: 'I' },
          { playerId: player2Id, type: 'X' },
        ],
        comment: 'Second game',
      },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(game2Response)
    expect(game2Response.statusCode).toBe(201)

    await new Promise(resolve => setTimeout(resolve, 50))

    // Step 7: Verify tournament results before closing
    const resultsBeforeClose = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(resultsBeforeClose)
    const scores = resultsBeforeClose.body as Record<string, {
      plusRemainder: number
      minusRemainder: number
      plusClusters: number
      minusClusters: number
      netScore: number
    }>

    // Player 1: 4 I events = 1 cluster, 0 remainder
    expect(scores[player1Id]).toBeDefined()
    expect(scores[player1Id].plusClusters).toBe(1)
    expect(scores[player1Id].plusRemainder).toBe(0)
    expect(scores[player1Id].minusClusters).toBe(0)
    expect(scores[player1Id].netScore).toBe(1)

    // Player 2: 1 I, 2 X events = 0 clusters, 1 I remainder, 2 X remainder
    expect(scores[player2Id]).toBeDefined()
    expect(scores[player2Id].plusClusters).toBe(0)
    expect(scores[player2Id].plusRemainder).toBe(1)
    expect(scores[player2Id].minusClusters).toBe(0)
    expect(scores[player2Id].minusRemainder).toBe(2)
    expect(scores[player2Id].netScore).toBe(0)

    // Step 8: Close tournament (active → closed)
    const closeResponse = await invokeFunction(closeHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournamentId}/close`,
      body: { confirmation: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(closeResponse)
    expect((closeResponse.body as { state?: string }).state).toBe('closed')
    expect((closeResponse.body as { closed_at?: string }).closed_at).not.toBeNull()

    await new Promise(resolve => setTimeout(resolve, 50))

    // Step 9: Verify no active tournament exists after closing
    const activeAfterClose = await invokeFunction(activeHandler, {
      httpMethod: 'GET',
      path: '/api/tournaments/active',
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(activeAfterClose)
    expect(activeAfterClose.body).toBeNull()

    // Step 10: Verify tournament results after closing (should be same)
    const resultsAfterClose = await invokeFunction(resultsHandler, {
      httpMethod: 'GET',
      path: `/api/tournaments/${tournamentId}/results`,
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(resultsAfterClose)
    const scoresAfterClose = resultsAfterClose.body as Record<string, {
      plusRemainder: number
      minusRemainder: number
      plusClusters: number
      minusClusters: number
      netScore: number
    }>
    expect(scoresAfterClose[player1Id].netScore).toBe(1)
    expect(scoresAfterClose[player2Id].netScore).toBe(0)

    // Step 11: Verify games cannot be created for closed tournament
    const gameAfterCloseResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId,
        events: [{ playerId: player1Id, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })
    assertError(gameAfterCloseResponse, 400)
    expect((gameAfterCloseResponse.body as { error?: string }).error).toContain('not active')
  }, 30000) // 30 second timeout for complex test

  it('should enforce only one active tournament can exist', async () => {
    // Create and start first tournament
    const create1Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create1Response)
    const tournament1Id = (create1Response.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament1Id}/start`,
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Create second tournament
    const create2Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-16' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create2Response)
    const tournament2Id = (create2Response.body as { id?: string }).id!

    await new Promise(resolve => setTimeout(resolve, 50))

    // Attempt to start second tournament (should fail)
    const start2Response = await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament2Id}/start`,
      headers: createAuthHeaders(authToken),
    })

    assertError(start2Response, 400)
    expect((start2Response.body as { error?: string }).error).toContain('active')

    // Close first tournament
    await invokeFunction(closeHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament1Id}/close`,
      body: { confirmation: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })

    await new Promise(resolve => setTimeout(resolve, 50))

    // Now second tournament can be started
    const start2AfterCloseResponse = await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament2Id}/start`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(start2AfterCloseResponse)
    expect((start2AfterCloseResponse.body as { state?: string }).state).toBe('active')
  }, 30000) // 30 second timeout for complex test
})
