import { getTestDbPool } from './db-test-setup'

export interface TestPlayer {
  id: string
  name: string
  nickname: string
  avatar_data: Buffer | null
  deleted_at: Date | null
  created_at: Date
}

export interface TestTournament {
  id: string
  name: string
  state: 'draft' | 'active' | 'closed'
  started_at: Date | null
  closed_at: Date | null
  created_at: Date
}

export interface TestGame {
  id: string
  tournament_id: string
  comment: string | null
  photo_data: Buffer | null
  created_at: Date
}

export interface TestScoreEvent {
  id: string
  game_id: string
  player_id: string
  type: 'I' | 'X'
  created_at: Date
}

/**
 * Create a test player in the database
 */
export async function createTestPlayer(
  overrides: Partial<Omit<TestPlayer, 'id' | 'created_at'>> = {}
): Promise<string> {
  const pool = getTestDbPool()
  const { name = 'Test Player', nickname = 'Test', avatar_data = null } = overrides

  const result = await pool.query<{ id: string }>(
    'INSERT INTO players (name, nickname, avatar_data) VALUES ($1, $2, $3) RETURNING id',
    [name, nickname, avatar_data]
  )

  return result.rows[0].id
}

/**
 * Create a test tournament in the database
 */
export async function createTestTournament(
  overrides: Partial<Omit<TestTournament, 'id' | 'created_at'>> = {}
): Promise<string> {
  const pool = getTestDbPool()
  const {
    name = 'Test Tournament',
    state = 'draft',
    started_at = null,
    closed_at = null,
  } = overrides

  const result = await pool.query<{ id: string }>(
    'INSERT INTO tournaments (name, state, started_at, closed_at) VALUES ($1, $2, $3, $4) RETURNING id',
    [name, state, started_at, closed_at]
  )

  return result.rows[0].id
}

/**
 * Create a test game in the database
 */
export async function createTestGame(
  tournamentId: string,
  overrides: Partial<Omit<TestGame, 'id' | 'tournament_id' | 'created_at'>> = {}
): Promise<string> {
  const pool = getTestDbPool()
  const { comment = null, photo_data = null } = overrides

  const result = await pool.query<{ id: string }>(
    'INSERT INTO games (tournament_id, comment, photo_data) VALUES ($1, $2, $3) RETURNING id',
    [tournamentId, comment, photo_data]
  )

  return result.rows[0].id
}

/**
 * Create a test score event in the database
 * Note: Game should exist in test database (same DB handlers use in test mode)
 */
export async function createTestScoreEvent(
  gameId: string,
  playerId: string,
  type: 'I' | 'X' = 'I'
): Promise<string> {
  const pool = getTestDbPool()

  const result = await pool.query<{ id: string }>(
    'INSERT INTO score_events (game_id, player_id, type) VALUES ($1, $2, $3) RETURNING id',
    [gameId, playerId, type]
  )

  return result.rows[0].id
}

/**
 * Clean up all test data from database
 * Uses TRUNCATE CASCADE for efficient cleanup that handles all foreign key constraints
 */
export async function cleanupTestData(): Promise<void> {
  const pool = getTestDbPool()

  try {
    // Use TRUNCATE with CASCADE to handle all foreign key constraints automatically
    await pool.query('TRUNCATE TABLE score_events, games, tournaments, players RESTART IDENTITY CASCADE')
  } catch (error) {
    // If TRUNCATE fails, fall back to DELETE in correct order
    const client = await pool.connect()
    try {
      await client.query('BEGIN')
      await client.query('DELETE FROM score_events')
      await client.query('DELETE FROM games')
      await client.query('DELETE FROM tournaments')
      await client.query('DELETE FROM players')
      await client.query('COMMIT')
    } catch (deleteError) {
      await client.query('ROLLBACK')
      throw deleteError
    } finally {
      client.release()
    }
  }
}
