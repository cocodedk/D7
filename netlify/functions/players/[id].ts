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
    const id = event.path.split('/').pop()

    if (!id) {
      return errorResponse('Player ID is required', 400)
    }

    if (event.httpMethod === 'PUT') {
      const body = await parseBody<{
        name?: string
        nickname?: string
        avatar?: string
      }>(event)

      const updates: string[] = []
      const values: unknown[] = []
      let paramCount = 1

      if (body.name !== undefined) {
        updates.push(`name = $${paramCount++}`)
        values.push(body.name)
      }
      if (body.nickname !== undefined) {
        updates.push(`nickname = $${paramCount++}`)
        values.push(body.nickname)
      }
      if (body.avatar !== undefined) {
        updates.push(`avatar_data = $${paramCount++}`)
        values.push(body.avatar ? base64ToBuffer(body.avatar) : null)
      }

      if (updates.length === 0) {
        return errorResponse('No fields to update', 400)
      }

      values.push(id)

      const result = await queryOne<Player>(
        `UPDATE players
         SET ${updates.join(', ')}
         WHERE id = $${paramCount} AND deleted_at IS NULL
         RETURNING id, name, nickname, avatar_data, deleted_at, created_at`,
        values
      )

      if (!result) {
        return errorResponse('Player not found', 404)
      }

      return jsonResponse({
        id: result.id,
        name: result.name,
        nickname: result.nickname,
        avatar: result.avatar_data ? result.avatar_data.toString('base64') : null,
        created_at: result.created_at,
      })
    }

    if (event.httpMethod === 'DELETE') {
      const result = await queryOne<{ id: string }>(
        `UPDATE players
         SET deleted_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [id]
      )

      if (!result) {
        return errorResponse('Player not found', 404)
      }

      return jsonResponse({ message: 'Player deleted' })
    }

    return errorResponse('Method not allowed', 405)
  } catch (error) {
    console.error('Error:', error)
    return errorResponse('Internal server error', 500)
  }
})

export { handler }
