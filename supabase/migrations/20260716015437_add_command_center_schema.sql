/*
# Rakshak AI Command Center Schema Extension

## Overview
Extends the existing reports table with verification, trust score, weather, and duplicate detection columns.
Creates a new profiles table for per-user trust scores.

## New Tables
- `profiles`: Per-user profile with trust_score (default 50). Linked to auth.users.

## Modified Tables
- `reports`: Adds columns for verification status, trust score, image authenticity,
  weather data, nearby services, duplicate detection, and assigned rescue team.

## Security
- `profiles`: RLS enabled, owner-scoped CRUD (authenticated only).
- `reports`: Existing RLS policies remain. New columns are accessible via existing policies.

## Important Notes
1. All new columns on `reports` are nullable to preserve existing data.
2. `profiles.trust_score` defaults to 50 (neutral trust).
3. `profiles.trust_history` is a jsonb array tracking trust score changes.
*/

-- 1. Create profiles table for user trust scores
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  trust_score integer NOT NULL DEFAULT 50 CHECK (trust_score >= 0 AND trust_score <= 100),
  trust_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  full_name text,
  phone text,
  role text NOT NULL DEFAULT 'citizen',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- 2. Add verification columns to reports
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'verification_status') THEN
    ALTER TABLE reports ADD COLUMN verification_status text NOT NULL DEFAULT 'pending';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'trust_score') THEN
    ALTER TABLE reports ADD COLUMN trust_score integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'image_authenticity') THEN
    ALTER TABLE reports ADD COLUMN image_authenticity integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'is_duplicate') THEN
    ALTER TABLE reports ADD COLUMN is_duplicate boolean NOT NULL DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'duplicate_of') THEN
    ALTER TABLE reports ADD COLUMN duplicate_of uuid;
  END IF;
END $$;

-- 3. Add weather columns to reports
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'weather_temp') THEN
    ALTER TABLE reports ADD COLUMN weather_temp real;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'weather_humidity') THEN
    ALTER TABLE reports ADD COLUMN weather_humidity real;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'weather_wind_speed') THEN
    ALTER TABLE reports ADD COLUMN weather_wind_speed real;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'weather_rainfall') THEN
    ALTER TABLE reports ADD COLUMN weather_rainfall real;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'weather_visibility') THEN
    ALTER TABLE reports ADD COLUMN weather_visibility real;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'weather_alert') THEN
    ALTER TABLE reports ADD COLUMN weather_alert text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'weather_summary') THEN
    ALTER TABLE reports ADD COLUMN weather_summary text;
  END IF;
END $$;

-- 4. Add nearby services and rescue team columns
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'nearby_services') THEN
    ALTER TABLE reports ADD COLUMN nearby_services jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'assigned_rescue_team') THEN
    ALTER TABLE reports ADD COLUMN assigned_rescue_team text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'reports' AND column_name = 'reported_by') THEN
    ALTER TABLE reports ADD COLUMN reported_by text;
  END IF;
END $$;

-- 5. Add index for duplicate detection queries
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_verification ON reports(verification_status);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
