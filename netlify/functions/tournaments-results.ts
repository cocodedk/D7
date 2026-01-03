import { Handler } from '@netlify/functions'
import { jsonResponse, errorResponse } from './_shared/utils'
import { query } from './_shared/db'
import { calculateTournamentScores, type ScoreEvent } from './_shared/scoring'

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

const handler: Handler = async (event) => {
  try {
    // Get ID from query params (set by redirect) or path
    const id = event.queryStringParameters?.id || event.path.split('/').slice(-2, -1)[0]

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
    const scoreEvents: ScoreEvent[] = events.map((e) => ({
      playerId: e.player_id,
      type: e.type,
    }))

    // Calculate scores using scoring engine
    const scores = calculateTournamentScores(scoreEvents, playerIds)

    // Add player information to scores
    const scoresWithPlayers = Object.entries(scores).reduce((acc, [playerId, score]) => {
      const player = playerMap.get(playerId)
      acc[playerId] = {
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
      return acc
    }, {} as Record<string, any>)

    return jsonResponse(scoresWithPlayers)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export { handler }
