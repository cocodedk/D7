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

interface PlayerInfo {
  id: string
  name: string
  nickname: string
  avatar_data: Buffer | null
}

const handler: Handler = async (event) => {
  try {
    // Improve ID extraction with validation
    const pathParts = event.path.split('/').filter(Boolean)
    const id = pathParts[pathParts.length - 1]

    // Validate UUID format
    if (!id || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
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

      // Get unique player IDs
      const playerIds = [...new Set(events.map((e) => e.player_id))]

      // Get player information
      const players = await query<PlayerInfo>(
        `SELECT id, name, nickname, avatar_data
         FROM players
         WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
        [playerIds]
      )

      // Create player map for quick lookup
      const playerMap = new Map(players.map((p) => [p.id, p]))

      return jsonResponse({
        id: game.id,
        tournament_id: game.tournament_id,
        comment: game.comment,
        photo: game.photo_data ? game.photo_data.toString('base64') : null,
        created_at: game.created_at,
        events: events.map((e) => {
          const player = playerMap.get(e.player_id)
          return {
            id: e.id,
            playerId: e.player_id,
            type: e.type,
            created_at: e.created_at,
            player: player
              ? {
                  id: player.id,
                  name: player.name,
                  nickname: player.nickname,
                  avatar: player.avatar_data ? player.avatar_data.toString('base64') : null,
                }
              : null,
          }
        }),
      })
    }

    if (event.httpMethod === 'DELETE') {
      // DELETE requires authentication - delegate to protected handler
      const deleteHandler = requireAuth(async (event) => {
        // Check if game was created within last 60 seconds using PostgreSQL's EXTRACT
        // This avoids JavaScript date parsing issues and timezone problems
        const game = await queryOne<{ age_seconds: number }>(
          `SELECT EXTRACT(EPOCH FROM (NOW() - created_at))::integer as age_seconds
           FROM games WHERE id = $1`,
          [id]
        )

        if (!game) {
          return errorResponse('Game not found', 404)
        }

        // Debug logging to help identify timing issues
        console.log(`DELETE game ${id}: age_seconds=${game.age_seconds}`)

        if (game.age_seconds > 60) {
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
      })
      return deleteHandler(event)
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export { handler }
