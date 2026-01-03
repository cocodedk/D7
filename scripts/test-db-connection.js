#!/usr/bin/env node

/**
 * Test database connection script
 * Verifies that the database connection string is set and can connect
 */

import { config } from 'dotenv'
import { resolve } from 'path'
import { Pool } from 'pg'

// Load environment variables from .env.local or .env
config({ path: resolve(process.cwd(), '.env.local') })
config({ path: resolve(process.cwd(), '.env') })

function getConnectionString() {
  // Match the same logic as db.ts
  // Use NETLIFY_DATABASE_URL (Netlify) or DATABASE_URL (local/tests)
  const connectionString = process.env.NETLIFY_DATABASE_URL || process.env.DATABASE_URL

  if (!connectionString) {
    throw new Error(
      'Database connection string not found. Set NETLIFY_DATABASE_URL or DATABASE_URL environment variable.'
    )
  }

  return connectionString
}

async function testConnection() {
  console.log('🔍 Testing database connection...\n')

  // Check environment variables
  console.log('Environment variables:')
  console.log(`  NETLIFY_DATABASE_URL: ${process.env.NETLIFY_DATABASE_URL ? '✅ Set' : '❌ Not set'}`)
  console.log(`  DATABASE_URL: ${process.env.DATABASE_URL ? '✅ Set' : '❌ Not set'}`)
  console.log(`  TEST_DATABASE_URL: ${process.env.TEST_DATABASE_URL ? '✅ Set (test mode)' : '❌ Not set'}`)
  console.log()

  try {
    // Get connection string using same logic as db.ts
    const connectionString = getConnectionString()
    console.log(`📡 Connection string: ${connectionString.substring(0, 50)}...`)
    console.log()

    // Create pool (matching db.ts settings)
    const pool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 1,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    })

    // Test the connection
    console.log('🔄 Testing connection...')
    const result = await pool.query('SELECT NOW() as current_time, version() as pg_version')

    console.log('✅ Connection successful!')
    console.log(`   Current time: ${result.rows[0].current_time}`)
    console.log(`   PostgreSQL: ${result.rows[0].pg_version.split(' ')[0]} ${result.rows[0].pg_version.split(' ')[1]}`)
    console.log()

    // Check if tournaments table exists
    console.log('🔄 Checking database schema...')
    const tablesResult = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)

    const tables = tablesResult.rows.map(row => row.table_name)
    console.log(`   Found ${tables.length} tables: ${tables.join(', ')}`)

    if (tables.includes('tournaments')) {
      const countResult = await pool.query('SELECT COUNT(*) as count FROM tournaments')
      console.log(`   Tournaments: ${countResult.rows[0].count} records`)
    }

    await pool.end()
    console.log()
    console.log('✅ All checks passed!')
    process.exit(0)
  } catch (error) {
    console.error('❌ Connection failed!')
    console.error('   Error:', error.message)
    if (error.message.includes('connection string not found')) {
      console.error('\n   💡 Tip: Create a .env.local file with:')
      console.error('      DATABASE_URL=postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require')
    }
    process.exit(1)
  }
}

testConnection()
