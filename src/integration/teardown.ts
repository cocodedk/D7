import { closeTestDatabase } from './db-test-setup'

/**
 * Teardown function called after all tests (for vitest globalTeardown)
 */
export default async function teardown(): Promise<void> {
  // Close database connections
  await closeTestDatabase()
}
