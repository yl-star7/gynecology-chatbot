-- Align pregnancy RAG embeddings with Schift's 1024-dimensional embedding model.

DROP INDEX IF EXISTS public.idx_pregnancy_documents_embedding;

ALTER TABLE public.content_pregnancy_documents
  ALTER COLUMN embedding TYPE vector(1024)
  USING subvector(embedding, 1, 1024)::vector(1024);

CREATE INDEX IF NOT EXISTS idx_pregnancy_documents_embedding
  ON public.content_pregnancy_documents
  USING hnsw (embedding vector_cosine_ops);

DROP FUNCTION IF EXISTS public.match_pregnancy_documents(vector, integer, integer);

CREATE OR REPLACE FUNCTION public.match_pregnancy_documents(
  query_embedding vector(1024),
  match_count integer DEFAULT 5,
  filter_week integer DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title varchar,
  content text,
  pregnancy_week integer,
  category varchar,
  metadata jsonb,
  similarity double precision
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    pd.id,
    pd.title,
    pd.content,
    pd.pregnancy_week,
    pd.category,
    pd.metadata,
    1 - (pd.embedding <=> query_embedding) AS similarity
  FROM public.content_pregnancy_documents pd
  WHERE filter_week IS NULL OR pd.pregnancy_week = filter_week
  ORDER BY pd.embedding <=> query_embedding
  LIMIT match_count;
$$;
