import { Handler } from '@netlify/functions'
import { requireAuth } from '../_shared/auth'
import { jsonResponse, errorResponse } from '../_shared/utils'
import { query, queryOne, getDbPool } from '../_shared/db'

interface Game {
  id: string
  tournament_id: string
  comment: string | null
  photo_data: Buffer | null
  created_at: string
}

interface ScoreEvent {
  id: string
  player_id: string
  type: 'I' | 'X'
  created_at: string
}

const handler: Handler = requireAuth(async (event) => {
  try {
    const id = event.path.split('/').pop()

    if (!id) {
      return errorResponse('Game ID is required', 400)
    }

    if (event.httpMethod === 'GET') {
      const game = await queryOne<Game>(
        'SELECT id, tournament_id, comment, photo_data, created_at FROM games WHERE id = $1',
        [id]
      )

      if (!game) {
        return errorResponse('Game not found', 404)
      }

      const events = await query<ScoreEvent>(
        'SELECT id, player_id, type, created_at FROM score_events WHERE game_id = $1 ORDER BY created_at',
        [id]
      )

      return jsonResponse({
        id: game.id,
        tournament_id: game.tournament_id,
        comment: game.comment,
        photo: game.photo_data ? game.photo_data.toString('base64') : null,
        created_at: game.created_at,
        events: events.map((e) => ({
          id: e.id,
          playerId: e.player_id,
          type: e.type,
          created_at: e.created_at,
        })),
      })
    }

    if (event.httpMethod === 'DELETE') {
      // Check if game was created within last 60 seconds
      const game = await queryOne<{ created_at: string }>(
        'SELECT created_at FROM games WHERE id = $1',
        [id]
      )

      if (!game) {
        return errorResponse('Game not found', 404)
      }

      const createdAt = new Date(game.created_at).getTime()
      const now = Date.now()
      const ageSeconds = (now - createdAt) / 1000

      if (ageSeconds > 60) {
        return errorResponse('Game can only be deleted within 60 seconds of creation', 400)
      }

      const pool = getDbPool()
      const client = await pool.connect()

      try {
        await client.query('BEGIN')

        // Delete score events first (foreign key constraint)
        await client.query('DELETE FROM score_events WHERE game_id = $1', [id])

        // Delete game
        await client.query('DELETE FROM games WHERE id = $1', [id])

        await client.query('COMMIT')

        return jsonResponse({ message: 'Game deleted' })
      } catch (error) {
        await client.query('ROLLBACK')
        throw error
      } finally {
        client.release()
      }
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
