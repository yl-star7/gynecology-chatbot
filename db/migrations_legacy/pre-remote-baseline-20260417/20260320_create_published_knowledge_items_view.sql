CREATE OR REPLACE VIEW public.published_knowledge_items AS
  SELECT id, slug, section, title, body, status, updated_at
  FROM content.knowledge_items
  WHERE status = 'published'
  ORDER BY updated_at DESC;
