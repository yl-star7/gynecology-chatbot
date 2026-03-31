-- Create public schema aliases for content tables
-- These make content.* tables accessible via Supabase REST API

CREATE OR REPLACE VIEW public.pregnancy_week_data AS
SELECT * FROM content.pregnancy_week_data;

CREATE OR REPLACE VIEW public.week_checklists AS
SELECT * FROM content.week_checklists;

CREATE OR REPLACE VIEW public.week_questions AS
SELECT * FROM content.week_questions;

CREATE OR REPLACE VIEW public.pregnancy_day_contents AS
SELECT * FROM content.pregnancy_day_contents;

CREATE OR REPLACE VIEW public.knowledge_items AS
SELECT * FROM content.knowledge_items;

CREATE OR REPLACE VIEW public.pregnancy_week_media AS
SELECT * FROM content.pregnancy_week_media;