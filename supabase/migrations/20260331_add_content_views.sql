-- Add content schema tables to Supabase
-- These exist in local docker but not in Supabase

-- Create content schema if not exists (Supabase management API doesn't support this, so we create views in public schema instead)

-- Create views for content data in public schema
-- These mirror the content.* tables for Supabase REST API access

DROP VIEW IF EXISTS public.content_week_data;
CREATE OR REPLACE VIEW public.content_week_data AS
SELECT * FROM content.pregnancy_week_data;

DROP VIEW IF EXISTS public.content_week_checklists;
CREATE OR REPLACE VIEW public.content_week_checklists AS
SELECT * FROM content.week_checklists;

DROP VIEW IF EXISTS public.content_week_questions;
CREATE OR REPLACE VIEW public.content_week_questions AS
SELECT * FROM content.week_questions;

DROP VIEW IF EXISTS public.content_pregnancy_day_contents;
CREATE OR REPLACE VIEW public.content_pregnancy_day_contents AS
SELECT * FROM content.pregnancy_day_contents;

DROP VIEW IF EXISTS public.content_knowledge_items;
CREATE OR REPLACE VIEW public.content_knowledge_items AS
SELECT * FROM content.knowledge_items;

DROP VIEW IF EXISTS public.content_pregnancy_week_media;
CREATE OR REPLACE VIEW public.content_pregnancy_week_media AS
SELECT * FROM content.pregnancy_week_media;