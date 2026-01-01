import { Handler } from '@netlify/functions'
import { requireAuth } from '../../_shared/auth'
import { jsonResponse, errorResponse } from '../../_shared/utils'
import { query } from '../../_shared/db'
import { calculateTournamentScores, type ScoreEvent } from '../../_shared/scoring'

interface ScoreEventRow {
  player_id: string
  type: 'I' | 'X'
}

const handler: Handler = requireAuth(async (event) => {
  try {
    const id = event.path.split('/').slice(-2, -1)[0]

    if (!id) {
      return errorResponse('Tournament ID is required', 400)
    }

    // Get all score events for this tournament
    const events = await query<ScoreEventRow>(
      `SELECT se.player_id, se.type
       FROM score_events se
       JOIN games g ON se.game_id = g.id
       WHERE g.tournament_id = $1
       ORDER BY se.created_at`,
      [id]
    )

    // Get unique player IDs
    const playerIds = [...new Set(events.map((e) => e.player_id))]

    // Convert to ScoreEvent format
    const scoreEvents: ScoreEvent[] = events.map((e) => ({
      playerId: e.player_id,
      type: e.type,
    }))

    // Calculate scores using scoring engine
    const scores = calculateTournamentScores(scoreEvents, playerIds)

    return jsonResponse(scores)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
