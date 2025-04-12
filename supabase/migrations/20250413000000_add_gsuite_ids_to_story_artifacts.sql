
-- Add Google Doc IDs to story_artifacts table
ALTER TABLE story_artifacts
ADD COLUMN IF NOT EXISTS lld_gsuite_id TEXT,
ADD COLUMN IF NOT EXISTS code_gsuite_id TEXT,
ADD COLUMN IF NOT EXISTS test_gsuite_id TEXT;
