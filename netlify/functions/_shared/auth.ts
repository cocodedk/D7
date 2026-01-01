import { Handler, HandlerEvent, HandlerContext, HandlerResponse } from '@netlify/functions'

export function verifyAuth(event: { headers: Record<string, string | undefined> }): boolean {
  const authHeader = event.headers.authorization || event.headers.Authorization
  if (!authHeader) return false

  const token = authHeader.replace('Bearer ', '')
  // For simplicity, accept any token that was generated (stored in localStorage)
  // In production, implement proper JWT validation
  return token.length > 0
}

export function requireAuth(handler: Handler): Handler {
  return async (event: HandlerEvent, context: HandlerContext): Promise<HandlerResponse> => {
    const headers: Record<string, string> = {}
    for (const [key, value] of Object.entries(event.headers)) {
      if (value !== undefined) {
        headers[key] = value
      }
    }

    if (!verifyAuth({ headers })) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Unauthorized' }),
      }
    }
    const result = await handler(event, context)
    return result || { statusCode: 500, body: JSON.stringify({ error: 'Internal server error' }) }
  }
}

// Token generation moved to login.ts
