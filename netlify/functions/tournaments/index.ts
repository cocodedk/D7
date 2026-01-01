import { Handler } from '@netlify/functions'
import { requireAuth } from '../_shared/auth'
import { jsonResponse, errorResponse, parseBody } from '../_shared/utils'
import { query, queryOne } from '../_shared/db'

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
    if (event.httpMethod === 'GET') {
      const tournaments = await query<Tournament>(
        'SELECT id, TO_CHAR(date, \'YYYY-MM-DD\') as date, state, started_at, closed_at, created_at FROM tournaments ORDER BY date DESC, created_at DESC'
      )

      return jsonResponse(tournaments)
    }

    if (event.httpMethod === 'POST') {
      const body = await parseBody<{ date: string }>(event)

      if (!body.date) {
        return errorResponse('Tournament date is required', 400)
      }

      // Check if a tournament with this date already exists
      const existing = await queryOne<{ id: string }>(
        'SELECT id FROM tournaments WHERE date = $1',
        [body.date]
      )

      if (existing) {
        return errorResponse('A tournament already exists for this date', 409)
      }

      try {
        const result = await queryOne<Tournament>(
          `INSERT INTO tournaments (date, state)
           VALUES ($1, 'draft')
           RETURNING id, TO_CHAR(date, 'YYYY-MM-DD') as date, state, started_at, closed_at, created_at`,
          [body.date]
        )

        if (!result) {
          return errorResponse('Failed to create tournament', 500)
        }

        return jsonResponse(result, 201)
      } catch (dbError: any) {
        // Handle unique constraint violation as a fallback
        if (dbError?.code === '23505' || dbError?.constraint === 'tournaments_date_unique') {
          return errorResponse('A tournament already exists for this date', 409)
        }
        throw dbError
      }
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
