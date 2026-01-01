# Database Setup Guide - Dev and Prod Separation

## Current Situation

You have `NETLIFY_DATABASE_URL` set to the **same database** for all contexts:
- Production
- Deploy Previews
- Branch deploys
- Preview Server & Agent Runners
- Local development

This means all environments share the same data, which is not ideal.

## Recommended Setup

### Option 1: Two Databases (Recommended)

**Production Database:**
- Used for: Production deploys only
- Contains: Real production data
- Connection: `postgresql://...prod-pooler.../neondb_prod`

**Development Database:**
- Used for: Dev, Previews, Branch deploys, Local
- Contains: Test/development data
- Connection: `postgresql://...dev-pooler.../neondb_dev`

### Option 2: Keep Current as Prod, Create New Dev

1. **Keep current database as Production**
   - The existing `ep-broad-credit-ae2469h9-pooler` connection
   - Use this for Production context only

2. **Create new database in Neon for Development**
   - Create a new Neon project or branch
   - Get the pooled connection string
   - Use this for all other contexts

## Steps to Configure

### Step 1: Create Dev Database in Neon

1. Go to Neon dashboard
2. Either:
   - Create a new project (recommended for complete separation)
   - Or create a branch from your current database
3. Get the **pooled connection string** (ends with `-pooler`)
4. Copy the connection string

### Step 2: Update Netlify Environment Variables

1. Go to Netlify Dashboard → D7DK → Site configuration → Environment variables
2. Find `NETLIFY_DATABASE_URL`
3. Click to edit
4. Set different values for different contexts:

**Production:**
```
postgresql://neondb_owner:npg_3MHwXSDar7sq@ep-broad-credit-ae2469h9-pooler.c-2.us-east-2.aws.neon.tech/neondb?channel_binding=require&sslmode=require
```

**All other contexts (Dev, Previews, Branch, Local):**
```
postgresql://dev_user:dev_password@dev-host-pooler.region.aws.neon.tech/neondb_dev?sslmode=require
```

### Step 3: Run Migrations

Run the initial schema migration on both databases:

```sql
-- Run this on both dev and prod databases
-- File: netlify/migrations/001_initial_schema.sql
```

### Step 4: Local Development

Update `.env.local`:

```bash
# Use dev database for local development
DATABASE_URL=postgresql://dev_user:dev_password@dev-host-pooler.region.aws.neon.tech/neondb_dev?sslmode=require
ADMIN_PASSWORD=your_dev_password
```

## Verification

After setup, verify:

1. **Production uses prod DB:**
   ```bash
   npx netlify env:get NETLIFY_DATABASE_URL --context production
   ```

2. **Dev uses dev DB:**
   ```bash
   npx netlify env:get NETLIFY_DATABASE_URL --context dev
   ```

3. **Local uses dev DB:**
   - Check `.env.local` has dev database URL

## Important Notes

- **Never use prod database for development/testing**
- **Always test migrations on dev first**
- **Keep dev and prod completely separate**
- **Use pooled connections** (ends with `-pooler`) for all contexts
- **Backup prod database** before major changes

## Database Naming Convention

Suggested names:
- Production: `d7dk_prod` or `neondb_prod`
- Development: `d7dk_dev` or `neondb_dev`
