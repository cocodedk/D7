import { Pool } from 'pg'

let pool: Pool | null = null
let poolConnectionString: string | null = null

export function getDbPool(): Pool {
  if (!pool) {
    // Use NETLIFY_DATABASE_URL (Netlify) or DATABASE_URL (local/tests)
    // Tests set DATABASE_URL = TEST_DATABASE_URL in their setup
    const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL

    if (!connectionString) {
      throw new Error(
        'Database connection string not found. Set NETLIFY_DATABASE_URL or DATABASE_URL environment variable.'
      )
    }

    poolConnectionString = connectionString
    // Use larger pool and longer timeout for tests
    const isTest = !!process.env.TEST_DATABASE_URL || process.env.NODE_ENV === 'test'
    pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      // Connection pool settings
      max: isTest ? 5 : 1, // More connections for tests, limit for serverless
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000, // Same timeout for tests and production
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
