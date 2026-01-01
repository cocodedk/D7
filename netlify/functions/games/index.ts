import { Handler } from '@netlify/functions'
import { requireAuth } from '../_shared/auth'
import { jsonResponse, errorResponse, parseBody, base64ToBuffer } from '../_shared/utils'
import { query, queryOne, getDbPool } from '../_shared/db'

interface Game {
  id: string
  tournament_id: string
  comment: string | null
  photo_data: Buffer | null
  created_at: string
}

interface ScoreEventInput {
  playerId: string
  type: 'I' | 'X'
}

const handler: Handler = requireAuth(async (event) => {
  try {
    if (event.httpMethod === 'POST') {
      const body = await parseBody<{
        tournamentId: string
        events: ScoreEventInput[]
        comment?: string
        photo?: string
      }>(event)

      if (!body.tournamentId) {
        return errorResponse('Tournament ID is required', 400)
      }

      if (!body.events || body.events.length === 0) {
        return errorResponse('At least one score event is required', 400)
      }

      // Validate tournament is active
      const tournament = await queryOne<{ state: string }>(
        'SELECT state FROM tournaments WHERE id = $1',
        [body.tournamentId]
      )

      if (!tournament) {
        return errorResponse('Tournament not found', 404)
      }

      if (tournament.state !== 'active') {
        return errorResponse('Tournament is not active', 400)
      }

      const pool = getDbPool()
      const client = await pool.connect()

      try {
        await client.query('BEGIN')

        // Create game
        const gameResult = await client.query(
          `INSERT INTO games (tournament_id, comment, photo_data)
           VALUES ($1, $2, $3)
           RETURNING id, tournament_id, comment, photo_data, created_at`,
          [
            body.tournamentId,
            body.comment || null,
            body.photo ? base64ToBuffer(body.photo) : null,
          ]
        )

        const game = gameResult.rows[0] as Game
        const gameId = game.id

        // Insert score events
        for (const event of body.events) {
          await client.query(
            `INSERT INTO score_events (game_id, player_id, type)
             VALUES ($1, $2, $3)`,
            [gameId, event.playerId, event.type]
          )
        }

        await client.query('COMMIT')

        return jsonResponse(
          {
            id: game.id,
            tournament_id: game.tournament_id,
            comment: game.comment,
            photo: game.photo_data ? game.photo_data.toString('base64') : null,
            created_at: game.created_at,
          },
          201
        )
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
