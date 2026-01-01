import { Pool } from 'pg'
import { readFileSync } from 'fs'
import { join } from 'path'

let testPool: Pool | null = null

/**
 * Get test database connection pool
 */
export function getTestDbPool(): Pool {
  if (!testPool) {
    const connectionString = process.env.TEST_DATABASE_URL

    if (!connectionString) {
      throw new Error(
        'TEST_DATABASE_URL environment variable is required for integration tests'
      )
    }

    testPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      // More connections for tests
      max: 5,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    })
  }

  return testPool
}

/**
 * Run database migrations on test database
 */
export async function setupTestDatabase(): Promise<void> {
  const pool = getTestDbPool()
  const migrationPath = join(
    process.cwd(),
    'netlify',
    'migrations',
    '001_initial_schema.sql'
  )

  try {
    const migrationSQL = readFileSync(migrationPath, 'utf-8')
    await pool.query(migrationSQL)
  } catch (error) {
    // If tables already exist, that's okay
    if (error instanceof Error && error.message.includes('already exists')) {
      return
    }
    throw error
  }
}

/**
 * Reset test database by deleting all data in correct order
 * Uses CASCADE to handle foreign key constraints automatically
 * Verifies cleanup completed successfully
 */
export async function resetTestDatabase(): Promise<void> {
  const pool = getTestDbPool()

  // Use TRUNCATE with CASCADE to handle all foreign key constraints automatically
  // This is more efficient and handles all dependencies
  try {
    await pool.query('TRUNCATE TABLE score_events, games, tournaments, players RESTART IDENTITY CASCADE')

    // Verify cleanup completed - check that all tables are empty
    const scoreEventsCount = await pool.query('SELECT COUNT(*) FROM score_events')
    const gamesCount = await pool.query('SELECT COUNT(*) FROM games')
    const tournamentsCount = await pool.query('SELECT COUNT(*) FROM tournaments')
    const playersCount = await pool.query('SELECT COUNT(*) FROM players')

    if (
      parseInt(scoreEventsCount.rows[0].count) !== 0 ||
      parseInt(gamesCount.rows[0].count) !== 0 ||
      parseInt(tournamentsCount.rows[0].count) !== 0 ||
      parseInt(playersCount.rows[0].count) !== 0
    ) {
      throw new Error('Database cleanup verification failed - tables not empty')
    }
  } catch (error) {
    // If TRUNCATE fails (e.g., due to active connections), fall back to DELETE
    // Delete in reverse order of dependencies (respecting foreign keys)
    await pool.query('DELETE FROM score_events')
    await pool.query('DELETE FROM games')
    await pool.query('DELETE FROM tournaments')
    await pool.query('DELETE FROM players')

    // Verify cleanup after DELETE
    const scoreEventsCount = await pool.query('SELECT COUNT(*) FROM score_events')
    const gamesCount = await pool.query('SELECT COUNT(*) FROM games')
    const tournamentsCount = await pool.query('SELECT COUNT(*) FROM tournaments')
    const playersCount = await pool.query('SELECT COUNT(*) FROM players')

    if (
      parseInt(scoreEventsCount.rows[0].count) !== 0 ||
      parseInt(gamesCount.rows[0].count) !== 0 ||
      parseInt(tournamentsCount.rows[0].count) !== 0 ||
      parseInt(playersCount.rows[0].count) !== 0
    ) {
      throw new Error('Database cleanup verification failed after DELETE - tables not empty')
    }
  }
}

/**
 * Close test database connection pool
 */
export async function closeTestDatabase(): Promise<void> {
  if (testPool) {
    await testPool.end()
    testPool = null
  }
}
