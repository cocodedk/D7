import { Handler } from '@netlify/functions'
import { requireAuth } from '../_shared/auth'
import { jsonResponse, errorResponse, parseBody, base64ToBuffer } from '../_shared/utils'
import { query, queryOne } from '../_shared/db'

interface Player {
  id: string
  name: string
  nickname: string
  avatar_data: Buffer | null
  deleted_at: string | null
  created_at: string
}

const handler: Handler = requireAuth(async (event) => {
  try {
    if (event.httpMethod === 'GET') {
      const players = await query<Player>(
        'SELECT id, name, nickname, avatar_data, deleted_at, created_at FROM players WHERE deleted_at IS NULL ORDER BY created_at DESC'
      )

      return jsonResponse(
        players.map((p) => ({
          id: p.id,
          name: p.name,
          nickname: p.nickname,
          avatar: p.avatar_data ? p.avatar_data.toString('base64') : null,
          created_at: p.created_at,
        }))
      )
    }

    if (event.httpMethod === 'POST') {
      const body = await parseBody<{
        name: string
        nickname: string
        avatar?: string
      }>(event)

      if (!body.name || !body.nickname) {
        return errorResponse('Name and nickname are required', 400)
      }

      const avatarBuffer = body.avatar ? base64ToBuffer(body.avatar) : null

      const result = await queryOne<Player>(
        `INSERT INTO players (name, nickname, avatar_data)
         VALUES ($1, $2, $3)
         RETURNING id, name, nickname, avatar_data, deleted_at, created_at`,
        [body.name, body.nickname, avatarBuffer]
      )

      if (!result) {
        return errorResponse('Failed to create player', 500)
      }

      return jsonResponse(
        {
          id: result.id,
          name: result.name,
          nickname: result.nickname,
          avatar: result.avatar_data ? result.avatar_data.toString('base64') : null,
          created_at: result.created_at,
        },
        201
      )
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
