import { Handler, HandlerEvent } from '@netlify/functions'
import { requireAuth } from '../../_shared/auth'
import { jsonResponse, errorResponse } from '../../_shared/utils'
import { query } from '../../_shared/db'
import { calculateTournamentScores, type ScoreEvent } from '../../_shared/scoring'

interface ScoreEventRow {
  player_id: string
  type: 'I' | 'X'
}

const handler: Handler = requireAuth(async (event: HandlerEvent) => {
  try {
    const year = event.path.split('/').pop()

    if (!year || isNaN(parseInt(year))) {
      return errorResponse('Valid year is required', 400)
    }

    const yearInt = parseInt(year)
    const startDate = `${yearInt}-01-01`
    const endDate = `${yearInt + 1}-01-01`

    // Get all score events for the year
    const events = await query<ScoreEventRow>(
      `SELECT se.player_id, se.type
       FROM score_events se
       JOIN games g ON se.game_id = g.id
       WHERE g.created_at >= $1 AND g.created_at < $2
       ORDER BY se.created_at`,
      [startDate, endDate]
    )

    // Get unique player IDs
    const playerIds = [...new Set(events.map((e: ScoreEventRow) => e.player_id))]

    // Convert to ScoreEvent format
    const scoreEvents: ScoreEvent[] = events.map((e: ScoreEventRow) => ({
      playerId: e.player_id,
      type: e.type,
    }))

    // Calculate scores
    const scores = calculateTournamentScores(scoreEvents, playerIds)

    // Convert scores object to array format
    const scoresArray = Object.entries(scores).map(([playerId, score]) => ({
      playerId,
      ...score,
    }))

    return jsonResponse({
      year: yearInt,
      scores: scoresArray,
    })
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
