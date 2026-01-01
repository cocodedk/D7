import { setupTestDatabase, closeTestDatabase } from './db-test-setup'
import { config } from 'dotenv'
import { resolve } from 'path'

// Load environment variables from .env file FIRST, before any other imports
config({ path: resolve(process.cwd(), '.env') })

/**
 * Setup function called before all tests (for vitest globalSetup)
 */
export default async function setup(): Promise<void> {
  // Ensure TEST_DATABASE_URL is set
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error(
      'TEST_DATABASE_URL environment variable is required. Add it to your .env file.'
    )
  }

  // Set DATABASE_URL to TEST_DATABASE_URL so handlers use test database
  // This ensures the actual function handlers connect to the test database
  // IMPORTANT: This must be set before any handlers are imported
  // CRITICAL: Clear NETLIFY_DATABASE_URL FIRST, then set DATABASE_URL
  // getDbPool() now checks for TEST_DATABASE_URL in test mode, but we still
  // set DATABASE_URL as fallback and clear NETLIFY_DATABASE_URL to be safe
  delete process.env.NETLIFY_DATABASE_URL
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL

  // Verify the environment is set correctly
  if (process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL) {
    throw new Error('Failed to set DATABASE_URL to TEST_DATABASE_URL')
  }
  if (process.env.NETLIFY_DATABASE_URL) {
    throw new Error('NETLIFY_DATABASE_URL should be unset for tests')
  }
  if (!process.env.TEST_DATABASE_URL) {
    throw new Error('TEST_DATABASE_URL must be set for integration tests')
  }

  // Reset the database pool cache to force recreation with test database
  // This is critical because the pool is cached at module level
  // Now getDbPool() will detect TEST_DATABASE_URL and use it automatically
  try {
    const { resetDbPool, getDbPool, getPoolConnectionString } = await import('../../netlify/functions/_shared/db')

    // Reset any existing pool
    await resetDbPool()

    // Force pool creation now to verify it uses correct URL
    // This ensures the pool is created with TEST_DATABASE_URL before any tests run
    const testPool = getDbPool()

    // Verify the pool is using the correct connection string
    const actualConnectionString = getPoolConnectionString()
    if (actualConnectionString !== process.env.TEST_DATABASE_URL) {
      throw new Error(
        `Pool verification failed: Expected TEST_DATABASE_URL, ` +
        `but pool is using: ${actualConnectionString?.substring(0, 30)}...`
      )
    }
  } catch (error) {
    // If resetDbPool doesn't exist yet (shouldn't happen), continue anyway
    console.warn('Could not reset/verify database pool:', error)
    throw error // Re-throw to fail fast if pool setup is wrong
  }

  // Set up test database schema
  await setupTestDatabase()
}
