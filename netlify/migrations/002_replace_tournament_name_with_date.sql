-- Migration: Replace tournament name with date
-- This migration removes the name column and adds a date column with unique constraint

-- Add date column (nullable initially to handle existing data)
ALTER TABLE tournaments ADD COLUMN IF NOT EXISTS date DATE;

-- For existing tournaments, set date to created_at date
UPDATE tournaments SET date = DATE(created_at) WHERE date IS NULL;

-- Make date NOT NULL after setting values
ALTER TABLE tournaments ALTER COLUMN date SET NOT NULL;

-- Add unique constraint on date column to prevent duplicate tournaments on the same date
ALTER TABLE tournaments ADD CONSTRAINT tournaments_date_unique UNIQUE (date);

-- Remove name column
ALTER TABLE tournaments DROP COLUMN IF EXISTS name;
