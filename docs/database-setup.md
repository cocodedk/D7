# Database Setup - Dev and Prod

## Overview

The app uses **pooled connections** (recommended for serverless) and supports separate dev and prod databases.

## Connection String Priority

The code checks for database URLs in this order:
1. `NETLIFY_DATABASE_URL` - Pooled connection (auto-provided by Netlify for Neon)
2. `DATABASE_URL` - Fallback for local development

## Setting Up Dev and Prod Databases

### In Netlify Dashboard

1. Go to your site: **D7DK**
2. Navigate to **Site configuration** → **Environment variables**

### Development Database

For **dev context** (local development and branch previews):

1. Add environment variable:
   - **Key**: `NETLIFY_DATABASE_URL` (or `DATABASE_URL` for local)
   - **Value**: Your dev database connection string (pooled)
   - **Scopes**: Select **Dev** and **Branch deploys**

### Production Database

For **production**:

1. Add environment variable:
   - **Key**: `NETLIFY_DATABASE_URL` (or `DATABASE_URL`)
   - **Value**: Your production database connection string (pooled)
   - **Scopes**: Select **Production**

### Getting Pooled Connection Strings from Neon

1. Go to your Neon dashboard
2. Select your database project
3. Go to **Connection Details**
4. Use the **Pooled connection** string (not the direct connection)
5. Format: `postgresql://user:password@host-pooler.region.aws.neon.tech/dbname?sslmode=require`

## Local Development Setup

For local development, create `.env.local`:

```bash
# Use your dev database
DATABASE_URL=postgresql://user:password@dev-db-pooler.region.aws.neon.tech/dbname?sslmode=require
ADMIN_PASSWORD=your_dev_password
```

## Database Naming Convention

Recommended setup:
- **Dev DB**: `d7dk_dev` or `d7dk-dev`
- **Prod DB**: `d7dk_prod` or `d7dk-prod`

## Migration Strategy

1. Run migrations on dev database first
2. Test thoroughly
3. Run same migrations on prod database
4. Use the same migration scripts for both

## Connection Pool Settings

The code uses these pool settings (optimized for serverless):
- `max: 1` - One connection per function instance
- `idleTimeoutMillis: 30000` - Close idle connections after 30s
- `connectionTimeoutMillis: 2000` - Fail fast if can't connect

## Verifying Setup

Check your environment variables:

```bash
# List all env vars
npx netlify env:list

# Get specific var (dev context)
npx netlify env:get NETLIFY_DATABASE_URL

# Get production var
npx netlify env:get NETLIFY_DATABASE_URL --context production
```

## Important Notes

- **Always use pooled connections** for Netlify Functions
- Pooled connections handle connection pooling automatically
- Direct connections can exhaust connection limits in serverless
- Dev and prod should be completely separate databases
- Never use prod database for development/testing
