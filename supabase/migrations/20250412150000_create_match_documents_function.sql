
-- Create function for vector similarity search
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding VECTOR(1536),
  match_threshold FLOAT,
  match_count INT,
  filter JSONB DEFAULT '{}'
)
RETURNS TABLE (
  id UUID,
  project_id UUID,
  document_id UUID,
  document_type TEXT,
  chunk_text TEXT,
  chunk_index INTEGER,
  document_name TEXT,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
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
    1 - (pc.embedding <=> query_embedding) AS similarity
  FROM
    project_chunks pc
  JOIN
    documents d ON pc.document_id = d.id
  WHERE
    -- Apply project filter if provided
    (
      (filter->>'project_id' IS NULL) OR
      (pc.project_id::TEXT IN (SELECT jsonb_array_elements_text(filter->'project_id')))
    )
    -- Only include results above the similarity threshold
    AND (1 - (pc.embedding <=> query_embedding)) > match_threshold
  ORDER BY
    pc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
