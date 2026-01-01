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
    try {
      const headers: Record<string, string> = {}
      for (const [key, value] of Object.entries(event.headers)) {
        if (value !== undefined) {
          headers[key] = value
        }
      }

      if (!verifyAuth({ headers })) {
        return {
          statusCode: 401,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Unauthorized' }),
        }
      }

      const result = await handler(event, context)

      if (!result) {
        console.error('[requireAuth] Handler returned undefined/null result')
        return {
          statusCode: 500,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ error: 'Internal server error: Handler returned no response' }),
        }
      }

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      const errorStack = error instanceof Error ? error.stack : undefined
      console.error('[requireAuth] Unhandled error:', {
        message: errorMessage,
        stack: errorStack,
        error: error,
      })
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ error: `Internal server error: ${errorMessage}` }),
      }
    }
  }
}

// Token generation moved to login.ts
