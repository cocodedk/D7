import { Handler } from '@netlify/functions'
import { requireAuth } from '../_shared/auth'
import { jsonResponse, errorResponse } from '../_shared/utils'
import { queryOne } from '../_shared/db'

interface Tournament {
  id: string
  date: string
  state: 'draft' | 'active' | 'closed'
  started_at: string | null
  closed_at: string | null
  created_at: string
}

const handler: Handler = requireAuth(async () => {
  try {
    const tournament = await queryOne<Tournament>(
      "SELECT id, TO_CHAR(date, 'YYYY-MM-DD') as date, state, started_at, closed_at, created_at FROM tournaments WHERE state = 'active' ORDER BY started_at DESC LIMIT 1"
    )

    // Ensure we return null (not undefined or empty array) when no tournament is found
    if (!tournament) {
      const response = jsonResponse(null)
      console.log('[tournaments/active] No active tournament found, returning null')
      return response
    }

    console.log('[tournaments/active] Found active tournament:', tournament.id)
    return jsonResponse(tournament)
  } catch (error) {
    console.error('[tournaments/active] Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
