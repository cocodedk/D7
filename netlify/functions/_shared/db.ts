import { Pool } from 'pg'

let pool: Pool | null = null
let poolConnectionString: string | null = null

export function getDbPool(): Pool {
  if (!pool) {
    // In test mode, prioritize TEST_DATABASE_URL to ensure handlers use test database
    // This is critical for integration tests where test data is created in test DB
    // but handlers need to query from the same database
    const isTestMode = !!process.env.TEST_DATABASE_URL
    const connectionString = isTestMode
      ? (process.env.TEST_DATABASE_URL || process.env.DATABASE_URL)
      : (process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL)

    if (!connectionString) {
      throw new Error(
        'Database connection string not found. Set NETLIFY_DATABASE_URL or DATABASE_URL environment variable.'
      )
    }

    // Verify in test mode that we're using TEST_DATABASE_URL
    if (isTestMode && connectionString !== process.env.TEST_DATABASE_URL) {
      throw new Error(
        `In test mode, getDbPool() must use TEST_DATABASE_URL. ` +
        `Got: ${connectionString?.substring(0, 20)}..., ` +
        `Expected: ${process.env.TEST_DATABASE_URL?.substring(0, 20)}...`
      )
    }

    poolConnectionString = connectionString
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      // Connection pool settings for serverless
      max: 1, // Limit connections per function instance
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })
  }

  return pool
}

/**
 * Reset the database pool cache.
 * Useful for testing when DATABASE_URL changes.
 * Note: Existing connections will remain until they close naturally.
 */
export async function resetDbPool(): Promise<void> {
  if (pool) {
    await pool.end()
    pool = null
    poolConnectionString = null
  }
}

/**
 * Get the connection string currently used by the pool (for verification)
 */
export function getPoolConnectionString(): string | null {
  return poolConnectionString
}

export async function query<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const pool = getDbPool()
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export async function queryOne<T = unknown>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}
