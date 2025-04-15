
-- Add testcases_content column to story_artifacts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'story_artifacts' 
                   AND column_name = 'testcases_content') THEN
        ALTER TABLE public.story_artifacts ADD COLUMN testcases_content TEXT;
    END IF;
END
$$;

-- Add testcases_gsuite_id column to story_artifacts table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'story_artifacts' 
                   AND column_name = 'testcases_gsuite_id') THEN
        ALTER TABLE public.story_artifacts ADD COLUMN testcases_gsuite_id TEXT;
    END IF;
END
$$;

-- Comment on columns
COMMENT ON COLUMN public.story_artifacts.testcases_content IS 'The generated test cases content for the Jira story';
COMMENT ON COLUMN public.story_artifacts.testcases_gsuite_id IS 'The GSuite document ID for the exported test cases';
