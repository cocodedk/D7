import { Handler } from '@netlify/functions'
import { jsonResponse } from '../_shared/utils'

export const handler: Handler = async () => {
  return jsonResponse({ message: 'Logged out' }, 200)
}
