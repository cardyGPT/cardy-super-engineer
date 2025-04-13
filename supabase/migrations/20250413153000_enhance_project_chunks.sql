
-- Add metadata column to project_chunks if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'project_chunks' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE "public"."project_chunks" ADD COLUMN "metadata" JSONB;
    END IF;
END
$$;

-- Add processed_at column to documents if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'processed_at'
    ) THEN
        ALTER TABLE "public"."documents" ADD COLUMN "processed_at" TIMESTAMP WITH TIME ZONE;
    END IF;
END
$$;

-- Add chunks_count column to documents if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'chunks_count'
    ) THEN
        ALTER TABLE "public"."documents" ADD COLUMN "chunks_count" INTEGER DEFAULT 0;
    END IF;
END
$$;

-- Add processing_metadata column to documents if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'documents' 
        AND column_name = 'processing_metadata'
    ) THEN
        ALTER TABLE "public"."documents" ADD COLUMN "processing_metadata" JSONB;
    END IF;
END
$$;

-- Update the match_documents function to include metadata
CREATE OR REPLACE FUNCTION public.match_documents(query_embedding vector, match_threshold double precision, match_count integer, filter jsonb DEFAULT '{}'::jsonb)
 RETURNS TABLE(id uuid, project_id uuid, document_id uuid, document_type text, chunk_text text, chunk_index integer, document_name text, similarity double precision, metadata jsonb)
 LANGUAGE plpgsql
AS $function$
#variable_conflict use_variable
BEGIN
  RETURN QUERY
  SELECT
    pc.id,
    pc.project_id,
    pc.document_id,
    pc.document_type,
    pc.chunk_text,
    pc.chunk_index,
    d.name AS document_name,
    1 - (pc.embedding <=> query_embedding) AS similarity,
    pc.metadata
  FROM
    project_chunks pc
  JOIN
    documents d ON pc.document_id = d.id
  WHERE
    -- Apply project filter if provided
    (
      (filter->>'project_id' IS NULL) OR
      (pc.project_id::TEXT = filter->>'project_id')
    )
    -- Apply document filter if provided
    AND (
      (filter->'document_ids' IS NULL) OR
      (filter->'document_ids' = '[]'::jsonb) OR
      (pc.document_id::TEXT IN (SELECT jsonb_array_elements_text(filter->'document_ids')))
    )
    -- Only include results above the similarity threshold
    AND (1 - (pc.embedding <=> query_embedding)) > match_threshold
  ORDER BY
    pc.embedding <=> query_embedding
  LIMIT match_count;
END;
$function$;

COMMENT ON FUNCTION public.match_documents IS 'Matches document chunks based on vector similarity with enhanced metadata support';
