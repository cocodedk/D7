import { HandlerResponse } from '@netlify/functions'

export function jsonResponse<T>(
  data: T,
  statusCode = 200
): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  }
}

export function errorResponse(
  message: string,
  statusCode = 400
): HandlerResponse {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ error: message }),
  }
}

/**
 * Convert base64 string to Buffer for PostgreSQL BYTEA
 */
export function base64ToBuffer(base64: string): Buffer {
  return Buffer.from(base64, 'base64')
}

/**
 * Convert Buffer to base64 string for API response
 */
export function bufferToBase64(buffer: Buffer | null): string | null {
  if (!buffer) return null
  return buffer.toString('base64')
}

/**
 * Parse request body
 */
export async function parseBody<T>(event: { body?: string | null }): Promise<T> {
  if (!event.body) {
    throw new Error('Request body is required')
  }
  return JSON.parse(event.body) as T
}
