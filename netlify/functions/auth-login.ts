import { Handler } from '@netlify/functions'
import { jsonResponse, errorResponse } from './_shared/utils'

export const handler: Handler = async (event) => {
  // #region agent log
  fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-login.ts:4',message:'Function entry',data:{method:event.httpMethod,hasBody:!!event.body},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'C'})}).catch(()=>{});
  // #endregion
  if (event.httpMethod !== 'POST') {
    return errorResponse('Method not allowed', 405)
  }

  try {
    const body = JSON.parse(event.body || '{}')
    const { password } = body

    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-login.ts:16',message:'Password received',data:{passwordLength:password?.length,passwordType:typeof password,hasPassword:!!password},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    if (!password) {
      return errorResponse('Password is required', 400)
    }

    const adminPassword = process.env.ADMIN_PASSWORD
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-login.ts:24',message:'Environment variable check',data:{hasAdminPassword:!!adminPassword,adminPasswordLength:adminPassword?.length,allEnvKeys:Object.keys(process.env).filter(k=>k.includes('ADMIN')||k.includes('PASSWORD')).join(',')},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'A'})}).catch(()=>{});
    // #endregion
    if (!adminPassword) {
      return errorResponse('Server configuration error', 500)
    }

    // #region agent log
    const passwordMatch = password === adminPassword;
    const passwordTrimmedMatch = password.trim() === adminPassword.trim();
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-login.ts:33',message:'Password comparison',data:{exactMatch:passwordMatch,trimmedMatch:passwordTrimmedMatch,receivedLength:password.length,expectedLength:adminPassword.length,receivedCharCodes:password.split('').slice(0,5).map(c=>c.charCodeAt(0)),expectedCharCodes:adminPassword.split('').slice(0,5).map(c=>c.charCodeAt(0))},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'B'})}).catch(()=>{});
    // #endregion

    if (password !== adminPassword) {
      return errorResponse('Invalid password', 401)
    }

    // Generate a simple token (in production, use JWT)
    const token = Buffer.from(`${Date.now()}-${Math.random()}`).toString('base64')
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-login.ts:43',message:'Token generated',data:{tokenLength:token.length,hasToken:!!token},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'E'})}).catch(()=>{});
    // #endregion

    return jsonResponse({ token }, 200)
  } catch (error) {
    // #region agent log
    fetch('http://127.0.0.1:7245/ingest/2e161807-a777-4f0a-9e48-5c755a702a4a',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'auth-login.ts:50',message:'Error caught',data:{errorMessage:error instanceof Error?error.message:String(error),errorType:error?.constructor?.name},timestamp:Date.now(),sessionId:'debug-session',runId:'post-fix',hypothesisId:'F'})}).catch(()=>{});
    // #endregion
    return errorResponse('Internal server error', 500)
  }
}
