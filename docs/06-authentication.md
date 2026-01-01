# Authentication Implementation

## Single Admin Password

- Password stored in Netlify environment variable: `ADMIN_PASSWORD`
- Never exposed to client
- No user database needed

## Flow

1. **Login Page**
   - Simple password input
   - Large tap target
   - Error handling for wrong password

2. **Backend Validation**
   - Netlify function compares input to env var
   - Returns JWT token or sets secure cookie
   - Token expires after session timeout

3. **Protected Routes**
   - Auth context checks token/cookie
   - Redirects to login if not authenticated
   - Token refresh mechanism

## Security

- HTTPS only (Netlify default)
- Secure cookie flags (httpOnly, secure, sameSite)
- Password never logged or exposed
- Session timeout: 24 hours (configurable)

## Implementation

- Auth context provides: `{ user, login, logout, isAuthenticated }`
- Protected route wrapper component
- Auto-redirect on 401 responses

## No User Management

- Single admin account
- No registration
- No password reset (manual env var update)
- No multi-user support
