#!/usr/bin/env node

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { Pool } from 'pg'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const connectionString = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL

if (!connectionString) {
  console.error('Error: DATABASE_URL or NETLIFY_DATABASE_URL must be set')
  process.exit(1)
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false,
  },
})

// Run migrations in order
const migrations = [
  '001_initial_schema.sql',
  '002_replace_tournament_name_with_date.sql',
]

async function runMigrations() {
  const client = await pool.connect()
  try {
    console.log('Running database migrations...\n')

    for (const migrationFile of migrations) {
      const migrationPath = join(__dirname, '../netlify/migrations', migrationFile)
      const sql = readFileSync(migrationPath, 'utf-8')

      try {
        console.log(`Running ${migrationFile}...`)
        await client.query(sql)
        console.log(`✓ ${migrationFile} completed successfully\n`)
      } catch (error) {
        // If tables/constraints already exist, that's okay (idempotent)
        if (error instanceof Error && (
          error.message.includes('already exists') ||
          error.message.includes('duplicate key') ||
          error.message.includes('constraint') ||
          error.message.includes('does not exist') // For DROP COLUMN IF EXISTS
        )) {
          console.log(`⚠ ${migrationFile} skipped (already applied or safe to skip)\n`)
          continue
        }
        throw error
      }
    }

    console.log('✓ All migrations completed successfully')
  } catch (error) {
    console.error('✗ Migration failed:', error.message)
    if (error instanceof Error && error.stack) {
      console.error('Stack:', error.stack)
    }
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigrations()
