
-- First ensure there's no duplicate story_id records
DELETE FROM story_artifacts 
WHERE id IN (
  SELECT id FROM (
    SELECT id, story_id, 
      ROW_NUMBER() OVER (PARTITION BY story_id ORDER BY updated_at DESC) as rn
    FROM story_artifacts
  ) t
  WHERE t.rn > 1
);

-- Add a unique constraint on story_id
ALTER TABLE story_artifacts 
  ADD CONSTRAINT story_artifacts_story_id_key UNIQUE (story_id);
