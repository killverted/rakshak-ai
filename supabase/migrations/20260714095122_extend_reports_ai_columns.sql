/*
# Extend reports table with Gemini AI analysis columns

1. Modified Tables
- `reports`
  - `ai_severity_label` (text) — Low | Medium | High severity label from Gemini
  - `ai_confidence` (numeric) — confidence score 0–100 returned by Gemini
  - `ai_hazards` (text[]) — array of possible hazards detected by Gemini
  - `ai_safety_actions` (text[]) — array of recommended safety actions from Gemini
  - `ai_analyzed_at` (timestamptz) — when the AI analysis was performed

2. Security
- No RLS policy changes. Existing owner-scoped policies on `reports` already cover
  UPDATE for these new columns (the owner can update their own report row).

3. Notes
- All new columns are nullable so existing rows remain valid.
- `ai_severity` (int 0–100) and `ai_summary` (text) columns already exist and are reused.
*/

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS ai_severity_label text,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric,
  ADD COLUMN IF NOT EXISTS ai_hazards text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_safety_actions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS ai_analyzed_at timestamptz;
