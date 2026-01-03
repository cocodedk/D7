#!/usr/bin/env node

/**
 * Reset test database before E2E tests
 * Clears all tournaments, games, score_events, and optionally players
 */

const { Pool } = require('pg')
require('dotenv').config({ path: '.env.local' })
require('dotenv').config({ path: '.env' })

async function resetTestDb() {
  const connectionString = process.env.DATABASE_URL || process.env.TEST_DATABASE_URL || process.env.NETLIFY_DATABASE_URL

  if (!connectionString) {
    console.error('No database connection string found in environment variables')
    console.error('Set DATABASE_URL, TEST_DATABASE_URL, or NETLIFY_DATABASE_URL')
    process.exit(1)
  }

  console.log('Connecting to database...')

  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false }
  })

  try {
    const client = await pool.connect()

    console.log('Clearing test data...')

    // Clear in order respecting foreign key constraints
    await client.query('DELETE FROM score_events')
    console.log('  - Cleared score_events')

    await client.query('DELETE FROM games')
    console.log('  - Cleared games')

    await client.query('DELETE FROM tournaments')
    console.log('  - Cleared tournaments')

    await client.query('DELETE FROM players')
    console.log('  - Cleared players')

    client.release()
    console.log('Database reset complete!')

  } catch (error) {
    console.error('Error resetting database:', error.message)
    process.exit(1)
  } finally {
    await pool.end()
  }
}

resetTestDb()
