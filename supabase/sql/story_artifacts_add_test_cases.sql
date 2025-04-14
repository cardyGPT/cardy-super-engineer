
-- Add the test_cases_content column to the story_artifacts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'story_artifacts' 
        AND column_name = 'test_cases_content'
    ) THEN
        ALTER TABLE story_artifacts ADD COLUMN test_cases_content TEXT;
        ALTER TABLE story_artifacts ADD COLUMN test_cases_gsuite_id TEXT;
    END IF;
END $$;
