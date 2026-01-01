# OAuth Access Control

## Controlling Who Can Access the App

With OAuth, you can restrict access to specific users by implementing an **email whitelist**.

## Implementation Options

### Option 1: Email Whitelist (Recommended)

After OAuth login, check if the user's email is in an allowed list:

```typescript
// In login handler
const allowedEmails = process.env.ALLOWED_EMAILS?.split(',') || []
const userEmail = oauthUser.email

if (!allowedEmails.includes(userEmail)) {
  return errorResponse('Access denied. Your email is not authorized.', 403)
}
```

**Environment Variable:**
```
ALLOWED_EMAILS=admin@example.com,user1@example.com,user2@example.com
```

### Option 2: Single Admin Email

Restrict to one specific email:

```typescript
const adminEmail = process.env.ADMIN_EMAIL
if (oauthUser.email !== adminEmail) {
  return errorResponse('Access denied', 403)
}
```

### Option 3: Domain Restriction

Allow all users from a specific domain:

```typescript
const allowedDomain = process.env.ALLOWED_DOMAIN // e.g., "company.com"
if (!oauthUser.email.endsWith(`@${allowedDomain}`)) {
  return errorResponse('Access denied', 403)
}
```

## Current Setup vs OAuth

**Current (Password):**
- ✅ Simple: one password
- ✅ Easy to change: update env var
- ✅ No external dependencies
- ❌ Less secure if password leaks
- ❌ No user identity tracking

**OAuth with Whitelist:**
- ✅ More secure (no password to leak)
- ✅ User identity known (email)
- ✅ Can track who did what
- ❌ More complex setup
- ❌ Requires OAuth provider config
- ❌ Need to manage whitelist

## Recommendation

For a single-admin app, **keep the password authentication** unless you:
- Need to track which user made changes
- Want to allow multiple admins
- Need audit logs with user identity

If you want OAuth, implement email whitelisting to maintain control.
