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

describe('Active Tournament Enforcement E2E Tests', () => {
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

  it('should prevent starting second tournament when one is active', async () => {
    // Create and start first tournament
    const create1Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create1Response)
    const tournament1Id = (create1Response.body as { id?: string }).id!


    await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament1Id}/start`,
      headers: createAuthHeaders(authToken),
    })


    // Verify first tournament is active
    const activeResponse = await invokeFunction(activeHandler, {
      httpMethod: 'GET',
      path: '/api/tournaments/active',
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(activeResponse)
    expect(activeResponse.body).not.toBeNull()
    expect((activeResponse.body as { id?: string }).id).toBe(tournament1Id)

    // Create second tournament
    const create2Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-16' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create2Response)
    const tournament2Id = (create2Response.body as { id?: string }).id!


    // Attempt to start second tournament (should fail)
    const start2Response = await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament2Id}/start`,
      headers: createAuthHeaders(authToken),
    })

    assertError(start2Response, 400)
    expect((start2Response.body as { error?: string }).error).toContain('active')
  }, 30000) // 30 second timeout for complex test

  it('should allow starting tournament after closing active one', async () => {
    // Create and start first tournament
    const create1Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create1Response)
    const tournament1Id = (create1Response.body as { id?: string }).id!


    await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament1Id}/start`,
      headers: createAuthHeaders(authToken),
    })


    // Close first tournament
    await invokeFunction(closeHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament1Id}/close`,
      body: { confirmation: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })


    // Verify no active tournament
    const activeAfterClose = await invokeFunction(activeHandler, {
      httpMethod: 'GET',
      path: '/api/tournaments/active',
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(activeAfterClose)
    expect(activeAfterClose.body).toBeNull()

    // Create and start second tournament
    const create2Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-16' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create2Response)
    const tournament2Id = (create2Response.body as { id?: string }).id!


    const start2Response = await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament2Id}/start`,
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(start2Response)
    expect((start2Response.body as { state?: string }).state).toBe('active')

    // Verify second tournament is now active
    const activeAfterStart2 = await invokeFunction(activeHandler, {
      httpMethod: 'GET',
      path: '/api/tournaments/active',
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(activeAfterStart2)
    expect(activeAfterStart2.body).not.toBeNull()
    expect((activeAfterStart2.body as { id?: string }).id).toBe(tournament2Id)
  })

  it('should only allow games to be created for active tournament', async () => {
    const playerId = await createTestPlayer({ name: 'Test Player', nickname: 'TP' })

    // Create draft tournament
    const createDraftResponse = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(createDraftResponse)
    const draftTournamentId = (createDraftResponse.body as { id?: string }).id!


    // Attempt to create game for draft tournament (should fail)
    const gameDraftResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: draftTournamentId,
        events: [{ playerId, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })

    assertError(gameDraftResponse, 400)
    expect((gameDraftResponse.body as { error?: string }).error).toContain('not active')

    // Start tournament
    await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${draftTournamentId}/start`,
      headers: createAuthHeaders(authToken),
    })


    // Now game creation should succeed
    const gameActiveResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: draftTournamentId,
        events: [{ playerId, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })

    assertSuccess(gameActiveResponse)
    expect(gameActiveResponse.statusCode).toBe(201)

    // Close tournament
    await invokeFunction(closeHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${draftTournamentId}/close`,
      body: { confirmation: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })


    // Attempt to create game for closed tournament (should fail)
    const gameClosedResponse = await invokeFunction(gamesHandler, {
      httpMethod: 'POST',
      path: '/api/games',
      body: {
        tournamentId: draftTournamentId,
        events: [{ playerId, type: 'I' }],
      },
      headers: createAuthHeaders(authToken),
    })

    assertError(gameClosedResponse, 400)
    expect((gameClosedResponse.body as { error?: string }).error).toContain('not active')
  })

  it('should maintain only one active tournament at a time', async () => {
    // Create multiple tournaments
    const create1Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create1Response)
    const tournament1Id = (create1Response.body as { id?: string }).id!


    const create2Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-16' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create2Response)
    const tournament2Id = (create2Response.body as { id?: string }).id!


    const create3Response = await invokeFunction(tournamentsHandler, {
      httpMethod: 'POST',
      path: '/api/tournaments',
      body: { date: '2024-01-17' },
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(create3Response)
    const tournament3Id = (create3Response.body as { id?: string }).id!


    // Start first tournament
    await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament1Id}/start`,
      headers: createAuthHeaders(authToken),
    })


    // Verify only tournament1 is active
    const active1 = await invokeFunction(activeHandler, {
      httpMethod: 'GET',
      path: '/api/tournaments/active',
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(active1)
    expect((active1.body as { id?: string }).id).toBe(tournament1Id)

    // Attempt to start tournament2 (should fail)
    const start2Response = await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament2Id}/start`,
      headers: createAuthHeaders(authToken),
    })
    assertError(start2Response, 400)

    // Attempt to start tournament3 (should fail)
    const start3Response = await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament3Id}/start`,
      headers: createAuthHeaders(authToken),
    })
    assertError(start3Response, 400)

    // Close tournament1
    await invokeFunction(closeHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament1Id}/close`,
      body: { confirmation: '2024-01-15' },
      headers: createAuthHeaders(authToken),
    })


    // Now tournament2 can be started
    await invokeFunction(startHandler, {
      httpMethod: 'PUT',
      path: `/api/tournaments/${tournament2Id}/start`,
      headers: createAuthHeaders(authToken),
    })


    // Verify tournament2 is now active
    const active2 = await invokeFunction(activeHandler, {
      httpMethod: 'GET',
      path: '/api/tournaments/active',
      headers: createAuthHeaders(authToken),
    })
    assertSuccess(active2)
    expect((active2.body as { id?: string }).id).toBe(tournament2Id)
  }, 30000) // 30 second timeout for complex test
})
