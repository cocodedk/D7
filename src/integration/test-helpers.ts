import { createHandlerEvent } from './function-invoker'

/**
 * Create Authorization header with Bearer token
 */
export function createAuthHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
  }
}

/**
 * Extract token from login response
 */
export function extractToken(response: { body?: { token?: string } }): string | null {
  if (response.body && typeof response.body === 'object' && 'token' in response.body) {
    return response.body.token as string
  }
  return null
}

/**
 * Assert that a response has a successful status code (2xx)
 */
export function assertSuccess(response: { statusCode: number }): void {
  if (response.statusCode < 200 || response.statusCode >= 300) {
    throw new Error(
      `Expected success status code (2xx), got ${response.statusCode}`
    )
  }
}

/**
 * Assert that a response has an error status code (4xx or 5xx)
 */
export function assertError(
  response: { statusCode: number },
  expectedStatus?: number
): void {
  if (response.statusCode < 400) {
    throw new Error(
      `Expected error status code (4xx or 5xx), got ${response.statusCode}`
    )
  }
  if (expectedStatus && response.statusCode !== expectedStatus) {
    throw new Error(
      `Expected status code ${expectedStatus}, got ${response.statusCode}`
    )
  }
}

/**
 * Assert that a response body contains an error message
 */
export function assertErrorMessage(
  response: { body?: unknown },
  expectedMessage?: string
): void {
  if (!response.body || typeof response.body !== 'object') {
    throw new Error('Response body is not an object')
  }

  const body = response.body as Record<string, unknown>
  if (!('error' in body)) {
    throw new Error('Response body does not contain error field')
  }

  if (expectedMessage && body.error !== expectedMessage) {
    throw new Error(
      `Expected error message "${expectedMessage}", got "${body.error}"`
    )
  }
}

/**
 * Generate a valid UUID that doesn't exist in the database
 * Format: 00000000-0000-0000-0000-000000000000
 */
export function generateNonExistentId(): string {
  return '00000000-0000-0000-0000-000000000000'
}

/**
 * Verify that a record exists in the handler's database (via getDbPool)
 * This ensures data created in test DB is visible to handlers
 * Throws descriptive error if record not found
 * Includes retry logic to handle potential timing issues
 */
export async function verifyRecordExistsInHandlerDb(
  table: string,
  id: string,
  idColumn: string = 'id',
  retries: number = 3
): Promise<boolean> {
  const { queryOne, getPoolConnectionString, getDbPool } = await import('../../netlify/functions/_shared/db')
  const poolUrl = getPoolConnectionString()
  const testDbUrl = process.env.TEST_DATABASE_URL

  // Verify pool is using correct URL
  if (poolUrl !== testDbUrl) {
    throw new Error(
      `Pool connection mismatch: Handler pool URL: ${poolUrl?.substring(0, 50)}..., ` +
      `Test DB URL: ${testDbUrl?.substring(0, 50)}...`
    )
  }

  // Retry logic to handle potential timing/transaction issues
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const record = await queryOne<{ id: string }>(
        `SELECT ${idColumn} FROM ${table} WHERE ${idColumn} = $1`,
        [id]
      )

      if (record) {
        return true
      }

      // If not found and not last attempt, wait a bit and retry
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)))
        continue
      }

      // Last attempt failed - throw descriptive error
      throw new Error(
        `Record ${id} not found in ${table} via handler's database after ${retries} attempts. ` +
        `Handler pool URL: ${poolUrl?.substring(0, 50)}..., ` +
        `Test DB URL: ${testDbUrl?.substring(0, 50)}...`
      )
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        if (attempt === retries - 1) {
          throw error // Re-throw on last attempt
        }
        // Wait and retry
        await new Promise(resolve => setTimeout(resolve, 50 * (attempt + 1)))
        continue
      }
      throw error // Re-throw other errors immediately
    }
  }

  return false
}

/**
 * Count records in handler's database (via getDbPool)
 */
export async function countRecordsInHandlerDb(table: string): Promise<number> {
  try {
    const { query } = await import('../../netlify/functions/_shared/db')
    const result = await query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table}`)
    return parseInt(result[0]?.count || '0', 10)
  } catch {
    return 0
  }
}

/**
 * Count records in test database (via getTestDbPool)
 */
export async function countRecordsInTestDb(table: string): Promise<number> {
  const { getTestDbPool } = await import('./db-test-setup')
  const pool = getTestDbPool()
  const result = await pool.query<{ count: string }>(`SELECT COUNT(*) as count FROM ${table}`)
  return parseInt(result.rows[0]?.count || '0', 10)
}
