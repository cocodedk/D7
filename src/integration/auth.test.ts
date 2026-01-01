import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { invokeFunction } from './function-invoker'
import { createAuthHeaders, extractToken, assertSuccess, assertError } from './test-helpers'
import { resetTestDatabase } from './db-test-setup'
import { handler as loginHandler } from '../../netlify/functions/auth-login'
import { handler as logoutHandler } from '../../netlify/functions/auth-logout'

describe('Authentication Integration Tests', () => {
  beforeEach(async () => {
    // CRITICAL: Ensure handlers use test database
    // Delete NETLIFY_DATABASE_URL first (it takes priority), then set DATABASE_URL
    delete process.env.NETLIFY_DATABASE_URL
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || process.env.DATABASE_URL

    // Reset the pool so it recreates with correct DATABASE_URL
    // getDbPool() now checks TEST_DATABASE_URL in test mode automatically
    try {
      const { resetDbPool } = await import('../../netlify/functions/_shared/db')
      await resetDbPool()
    } catch {
      // Ignore if resetDbPool doesn't exist
    }

    await resetTestDatabase()
  })

  afterEach(async () => {
    await resetTestDatabase()
  })

  describe('POST /api/auth-login', () => {
    it('should login with correct password and return token', async () => {
      const adminPassword = process.env.ADMIN_PASSWORD || 'getTestAdminPassword()'

      const response = await invokeFunction(loginHandler, {
        httpMethod: 'POST',
        path: '/api/auth-login',
        body: { password: adminPassword },
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('token')
      expect(typeof (response.body as { token?: string }).token).toBe('string')
      expect((response.body as { token?: string }).token?.length).toBeGreaterThan(0)
    })

    it('should return 401 with incorrect password', async () => {
      const response = await invokeFunction(loginHandler, {
        httpMethod: 'POST',
        path: '/api/auth-login',
        body: { password: 'wrong-password' },
      })

      assertError(response, 401)
      expect(response.body).toHaveProperty('error')
      expect((response.body as { error?: string }).error).toBe('Invalid password')
    })

    it('should return 400 with missing password', async () => {
      const response = await invokeFunction(loginHandler, {
        httpMethod: 'POST',
        path: '/api/auth-login',
        body: {},
      })

      assertError(response, 400)
      expect(response.body).toHaveProperty('error')
      expect((response.body as { error?: string }).error).toBe('Password is required')
    })

    it('should return 405 with wrong HTTP method', async () => {
      const response = await invokeFunction(loginHandler, {
        httpMethod: 'GET',
        path: '/api/auth-login',
      })

      assertError(response, 405)
      expect(response.body).toHaveProperty('error')
      expect((response.body as { error?: string }).error).toBe('Method not allowed')
    })

    it('should generate valid base64 token', async () => {
      const adminPassword = process.env.ADMIN_PASSWORD || 'getTestAdminPassword()'

      const response = await invokeFunction(loginHandler, {
        httpMethod: 'POST',
        path: '/api/auth-login',
        body: { password: adminPassword },
      })

      assertSuccess(response)
      const token = extractToken(response)
      expect(token).not.toBeNull()

      // Verify it's valid base64
      if (token) {
        expect(() => Buffer.from(token, 'base64')).not.toThrow()
      }
    })

    it('should return different tokens for multiple logins', async () => {
      const adminPassword = process.env.ADMIN_PASSWORD || 'getTestAdminPassword()'

      const response1 = await invokeFunction(loginHandler, {
        httpMethod: 'POST',
        path: '/api/auth-login',
        body: { password: adminPassword },
      })

      const response2 = await invokeFunction(loginHandler, {
        httpMethod: 'POST',
        path: '/api/auth-login',
        body: { password: adminPassword },
      })

      assertSuccess(response1)
      assertSuccess(response2)

      const token1 = extractToken(response1)
      const token2 = extractToken(response2)

      expect(token1).not.toBe(token2)
    })
  })

  describe('POST /api/auth-logout', () => {
    it('should logout successfully', async () => {
      const response = await invokeFunction(logoutHandler, {
        httpMethod: 'POST',
        path: '/api/auth-logout',
      })

      assertSuccess(response)
      expect(response.body).toHaveProperty('message')
    })
  })
})
