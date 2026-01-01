import { Handler } from '@netlify/functions'
import { requireAuth } from '../_shared/auth'
import { jsonResponse, errorResponse, parseBody } from '../_shared/utils'
import { query, queryOne } from '../_shared/db'

interface Tournament {
  id: string
  name: string
  state: 'draft' | 'active' | 'closed'
  started_at: string | null
  closed_at: string | null
  created_at: string
}

const handler: Handler = requireAuth(async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const tournaments = await query<Tournament>(
        'SELECT id, name, state, started_at, closed_at, created_at FROM tournaments ORDER BY created_at DESC'
      )

      return jsonResponse(tournaments)
    }

    if (event.httpMethod === 'POST') {
      const body = await parseBody<{ name: string }>(event)

      if (!body.name) {
        return errorResponse('Tournament name is required', 400)
      }

      const result = await queryOne<Tournament>(
        `INSERT INTO tournaments (name, state)
         VALUES ($1, 'draft')
         RETURNING id, name, state, started_at, closed_at, created_at`,
        [body.name]
      )

      if (!result) {
        return errorResponse('Failed to create tournament', 500)
      }

      return jsonResponse(result, 201)
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
