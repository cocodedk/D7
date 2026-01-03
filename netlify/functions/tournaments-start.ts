import { Handler } from '@netlify/functions'
import { requireAuth } from './_shared/auth'
import { jsonResponse, errorResponse } from './_shared/utils'
import { queryOne } from './_shared/db'

interface Tournament {
  id: string
  date: string
  state: 'draft' | 'active' | 'closed'
  started_at: string | null
  closed_at: string | null
  created_at: string
}

const handler: Handler = requireAuth(async (event) => {
  try {
    // Get ID from query params (set by redirect) or path
    const id = event.queryStringParameters?.id || event.path.split('/').slice(-2, -1)[0]

    if (!id) {
      return errorResponse('Tournament ID is required', 400)
    }

    // Check if tournament exists and is in draft state
    const tournament = await queryOne<Tournament>(
      "SELECT id, date, state FROM tournaments WHERE id = $1 AND state = 'draft'",
      [id]
    )

    if (!tournament) {
      return errorResponse('Tournament not found or not in draft state', 404)
    }

    // Check if there's already an active tournament
    const activeTournament = await queryOne<{ id: string }>(
      "SELECT id FROM tournaments WHERE state = 'active'"
    )

    if (activeTournament) {
      return errorResponse('Another tournament is already active', 400)
    }

    // Start the tournament
    const result = await queryOne<Tournament>(
      `UPDATE tournaments
       SET state = 'active', started_at = NOW()
       WHERE id = $1
       RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') as date, state, started_at, closed_at, created_at`,
      [id]
    )

    if (!result) {
      return errorResponse('Failed to start tournament', 500)
    }

    return jsonResponse(result)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
