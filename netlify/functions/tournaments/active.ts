import { Handler } from '@netlify/functions'
import { requireAuth } from '../_shared/auth'
import { jsonResponse, errorResponse } from '../_shared/utils'
import { queryOne } from '../_shared/db'

interface Tournament {
  id: string
  name: string
  state: 'draft' | 'active' | 'closed'
  started_at: string | null
  closed_at: string | null
  created_at: string
}

const handler: Handler = requireAuth(async () => {
  try {
    const tournament = await queryOne<Tournament>(
      "SELECT id, name, state, started_at, closed_at, created_at FROM tournaments WHERE state = 'active' ORDER BY started_at DESC LIMIT 1"
    )

    if (!tournament) {
      return jsonResponse(null)
    }

    return jsonResponse(tournament)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
