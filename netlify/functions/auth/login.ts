import { Handler } from '@netlify/functions'
import { jsonResponse, errorResponse } from '../_shared/utils'

export const handler: Handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { password } = body

    if (!password) {
      return errorResponse('Password is required', 400)
    }

    const adminPassword = process.env.ADMIN_PASSWORD
    if (!adminPassword) {
      return errorResponse('Server configuration error', 500)
    }

    if (password !== adminPassword) {
      return errorResponse('Invalid password', 401)
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64')

    return jsonResponse({ token }, 200)
  } catch (error) {
    return errorResponse('Internal server error', 500)
  }
}
