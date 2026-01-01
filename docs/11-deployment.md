# Netlify Deployment

## Prerequisites

- Netlify account
- Neon PostgreSQL database
- Git repository

## Environment Variables

Set in Netlify dashboard:

- `ADMIN_PASSWORD` - Admin login password
- `DATABASE_URL` - Neon PostgreSQL connection string
- `NODE_ENV` - `production`

## Build Configuration

### netlify.toml

```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200
```

## Functions Setup

- Functions in `netlify/functions/`
- Each endpoint is a separate function file
- Shared database connection module
- Error handling middleware

## Database Migration

- Run migrations on first deploy
- Use migration tool (e.g., node-pg-migrate)
- Or manual SQL scripts
- Document migration process

## Deployment Steps

1. Connect Git repository to Netlify
2. Set environment variables
3. Configure build settings
4. Deploy
5. Test authentication and database connection
6. Verify mobile responsiveness

## Post-Deployment

- Test all critical paths
- Verify image upload/storage
- Check mobile performance
- Monitor function logs
- Set up error tracking (optional)

## Continuous Deployment

- Auto-deploy on push to main branch
- Preview deployments for PRs
- Rollback capability via Netlify dashboard
