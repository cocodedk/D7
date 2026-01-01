import { Handler, HandlerEvent } from '@netlify/functions'
import { jsonResponse, errorResponse } from '../../_shared/utils'
import { query } from '../../_shared/db'
import { calculateTournamentScores, type ScoreEvent } from '../../_shared/scoring'

interface ScoreEventRow {
  player_id: string
  type: 'I' | 'X'
}

interface PlayerInfo {
  id: string
  name: string
  nickname: string
  avatar_data: Buffer | null
}

const handler: Handler = async (event: HandlerEvent) => {
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

    // Get player information
    const players = await query<PlayerInfo>(
      `SELECT id, name, nickname, avatar_data
       FROM players
       WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL`,
      [playerIds]
    )

    // Create player map for quick lookup
    const playerMap = new Map(players.map((p) => [p.id, p]))

    // Convert to ScoreEvent format
    const scoreEvents: ScoreEvent[] = events.map((e: ScoreEventRow) => ({
      playerId: e.player_id,
      type: e.type,
    }))

    // Calculate scores
    const scores = calculateTournamentScores(scoreEvents, playerIds)

    // Convert scores object to array format with player information
    const scoresArray = Object.entries(scores).map(([playerId, score]) => {
      const player = playerMap.get(playerId)
      return {
        playerId,
        ...score,
        player: player
          ? {
              id: player.id,
              name: player.name,
              nickname: player.nickname,
              avatar: player.avatar_data ? player.avatar_data.toString('base64') : null,
            }
          : null,
      }
    })

    return jsonResponse({
      year: yearInt,
      scores: scoresArray,
    })
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export { handler }
