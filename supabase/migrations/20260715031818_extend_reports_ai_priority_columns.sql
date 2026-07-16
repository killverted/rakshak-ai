/*
# Extend reports table with enhanced Gemini AI analysis columns

1. Modified Tables
- `reports`
  - `ai_priority_level` (text) — P1/P2/P3/P4 priority from Gemini
  - `ai_estimated_affected_area` (text) — estimated affected area from Gemini
  - Severity label now supports 'Critical' (existing column ai_severity_label is text, no change needed)

2. Security
- No RLS policy changes. Existing owner-scoped policies cover UPDATE.

3. Notes
- All new columns are nullable so existing rows remain valid.
*/

ALTER TABLE reports
  ADD COLUMN IF NOT EXISTS ai_priority_level text,
  ADD COLUMN IF NOT EXISTS ai_estimated_affected_area text;
