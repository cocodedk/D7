import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

export interface HandlerEventOptions {
  httpMethod?: string
  path?: string
  body?: unknown
  headers?: Record<string, string>
  queryStringParameters?: Record<string, string>
}

/**
 * Create a mock HandlerEvent for testing
 */
export function createHandlerEvent(options: HandlerEventOptions = {}): HandlerEvent {
  const {
    httpMethod = 'GET',
    path = '/',
    body,
    headers = {},
    queryStringParameters = {},
  } = options

  return {
    httpMethod,
    path,
    body: body ? JSON.stringify(body) : undefined,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
    queryStringParameters,
    isBase64Encoded: false,
    rawUrl: path,
    rawQuery: '',
    pathParameters: {},
    multiValueHeaders: {},
    multiValueQueryStringParameters: {},
  } as HandlerEvent
}

/**
 * Create a mock HandlerContext for testing
 */
export function createHandlerContext(): HandlerContext {
  return {
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:test-function',
    memoryLimitInMB: '128',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  } as HandlerContext
}

/**
 * Invoke a Netlify Function handler and return the response
 */
export async function invokeFunction(
  handler: Handler,
  eventOptions: HandlerEventOptions = {}
): Promise<{
  statusCode: number
  headers: Record<string, string>
  body: unknown
}> {
  const event = createHandlerEvent(eventOptions)
  const context = createHandlerContext()

  const response = await handler(event, context)

  if (!response) {
    throw new Error('Handler returned undefined response')
  }

  // Parse the response body
  let parsedBody: unknown
  try {
    parsedBody = response.body ? JSON.parse(response.body) : null
  } catch {
    parsedBody = response.body
  }

  // Extract headers
  const headers: Record<string, string> = {}
  if (response.headers) {
    for (const [key, value] of Object.entries(response.headers)) {
      headers[key.toLowerCase()] = String(value)
    }
  }

  return {
    statusCode: response.statusCode || 200,
    headers,
    body: parsedBody,
  }
}
