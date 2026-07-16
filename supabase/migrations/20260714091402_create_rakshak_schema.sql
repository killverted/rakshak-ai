/*
# Rakshak AI — Core Schema

1. Overview
Rakshak AI is a multi-user disaster management platform with sign-in. Citizens file
disaster reports, volunteers register and respond, and admins oversee incidents and
analytics. This migration creates the core tables and owner/shared RLS policies.

2. New Tables
- `reports` — disaster reports submitted by citizens.
  - id (uuid pk), user_id (uuid, defaults to auth user), disaster_type (text),
    description (text), severity (text: low|moderate|high|critical),
    status (text: pending|triaged|responding|resolved), lat (numeric), lng (numeric),
    location_label (text), image_url (text), ai_severity (int), ai_summary (text),
    created_at (timestamptz).
- `volunteers` — volunteer registrations.
  - id (uuid pk), user_id (uuid, defaults to auth user), name (text), phone (text),
    skills (text[]), availability (text: available|on-mission|offline), region (text),
    missions_completed (int default 0), created_at (timestamptz).
- `activity_log` — live platform activity feed.
  - id (uuid pk), user_id (uuid nullable), actor (text), action (text), detail (text),
    severity (text), created_at (timestamptz).

3. Security
- Enable RLS on all tables.
- `reports`: all authenticated users can SELECT (shared for dashboards); only the owner
  can INSERT / UPDATE / DELETE their own reports.
- `volunteers`: all authenticated users can SELECT; only the owner can INSERT / UPDATE /
  DELETE their own volunteer record.
- `activity_log`: all authenticated users can SELECT and INSERT (log events); no update or
  delete (append-only audit feed).
- Owner columns default to auth.uid() so client inserts that omit user_id still satisfy
  WITH CHECK policies.

4. Indexes
- reports (created_at desc), reports (status), reports (disaster_type), reports (user_id)
- volunteers (availability), volunteers (user_id)
- activity_log (created_at desc)
*/

CREATE TABLE IF NOT EXISTS reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  disaster_type text NOT NULL DEFAULT 'Other',
  description text NOT NULL DEFAULT '',
  severity text NOT NULL DEFAULT 'moderate',
  status text NOT NULL DEFAULT 'pending',
  lat numeric,
  lng numeric,
  location_label text,
  image_url text,
  ai_severity integer,
  ai_summary text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_reports" ON reports;
CREATE POLICY "select_reports" ON reports FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_reports" ON reports;
CREATE POLICY "insert_own_reports" ON reports FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_reports" ON reports;
CREATE POLICY "update_own_reports" ON reports FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_reports" ON reports;
CREATE POLICY "delete_own_reports" ON reports FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS reports_created_at_idx ON reports (created_at DESC);
CREATE INDEX IF NOT EXISTS reports_status_idx ON reports (status);
CREATE INDEX IF NOT EXISTS reports_disaster_type_idx ON reports (disaster_type);
CREATE INDEX IF NOT EXISTS reports_user_id_idx ON reports (user_id);

CREATE TABLE IF NOT EXISTS volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  phone text,
  skills text[] NOT NULL DEFAULT '{}',
  availability text NOT NULL DEFAULT 'available',
  region text,
  missions_completed integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE volunteers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_volunteers" ON volunteers;
CREATE POLICY "select_volunteers" ON volunteers FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_own_volunteers" ON volunteers;
CREATE POLICY "insert_own_volunteers" ON volunteers FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_volunteers" ON volunteers;
CREATE POLICY "update_own_volunteers" ON volunteers FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_volunteers" ON volunteers;
CREATE POLICY "delete_own_volunteers" ON volunteers FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS volunteers_availability_idx ON volunteers (availability);
CREATE INDEX IF NOT EXISTS volunteers_user_id_idx ON volunteers (user_id);

CREATE TABLE IF NOT EXISTS activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor text NOT NULL DEFAULT 'System',
  action text NOT NULL,
  detail text,
  severity text NOT NULL DEFAULT 'info',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_activity" ON activity_log;
CREATE POLICY "select_activity" ON activity_log FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "insert_activity" ON activity_log;
CREATE POLICY "insert_activity" ON activity_log FOR INSERT
  TO authenticated WITH CHECK (true);

CREATE INDEX IF NOT EXISTS activity_log_created_at_idx ON activity_log (created_at DESC);
