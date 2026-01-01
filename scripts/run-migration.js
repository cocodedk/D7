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

const migrationFile = join(__dirname, '../netlify/migrations/001_initial_schema.sql')
const sql = readFileSync(migrationFile, 'utf-8')

async function runMigration() {
  const client = await pool.connect()
  try {
    console.log('Running migration...')
    await client.query(sql)
    console.log('✓ Migration completed successfully')
  } catch (error) {
    console.error('✗ Migration failed:', error.message)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

runMigration()
