import { Handler } from '@netlify/functions'
import { requireAuth } from '../../_shared/auth'
import { jsonResponse, errorResponse, parseBody } from '../../_shared/utils'
import { queryOne } from '../../_shared/db'

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
    const id = event.path.split('/').slice(-2, -1)[0]

    if (!id) {
      return errorResponse('Tournament ID is required', 400)
    }

    // Debug: Check if tournament exists at all (regardless of state)
    const anyTournament = await queryOne<Tournament>(
      'SELECT id, TO_CHAR(date, \'YYYY-MM-DD\') as date, state FROM tournaments WHERE id = $1',
      [id]
    )

    // Get tournament to verify date
    const tournament = await queryOne<Tournament>(
      "SELECT id, TO_CHAR(date, 'YYYY-MM-DD') as date, state FROM tournaments WHERE id = $1 AND state = 'active'",
      [id]
    )

    if (!tournament) {
      // Provide more detailed error message for debugging
      if (!anyTournament) {
        return errorResponse(`Tournament not found: ${id}`, 404)
      }
      return errorResponse(
        `Tournament found but not active. Current state: ${anyTournament.state}`,
        404
      )
    }

    // Parse confirmation body
    const body = await parseBody<{ confirmation: string }>(event)

    if (body.confirmation !== tournament.date) {
      return errorResponse('Tournament date confirmation does not match', 400)
    }

    // Close the tournament
    const result = await queryOne<Tournament>(
      `UPDATE tournaments
       SET state = 'closed', closed_at = NOW()
       WHERE id = $1
       RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') as date, state, started_at, closed_at, created_at`,
      [id]
    )

    if (!result) {
      return errorResponse('Failed to close tournament', 500)
    }

    return jsonResponse(result)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
