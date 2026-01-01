import { Handler } from '@netlify/functions'
import { jsonResponse, errorResponse } from './_shared/utils'
import { query } from './_shared/db'

interface Tournament {
  id: string
  date: string
  state: 'draft' | 'active' | 'closed'
}

const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      // Return only closed tournaments for public viewing
      const tournaments = await query<Tournament>(
        `SELECT id, TO_CHAR(date, 'YYYY-MM-DD') as date, state
         FROM tournaments
         WHERE state = 'closed'
         ORDER BY date DESC, created_at DESC`
      )

      return jsonResponse(tournaments)
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('[public-tournaments] Error:', error)
    return errorResponse('Internal server error', 500)
  }
}

export { handler }
