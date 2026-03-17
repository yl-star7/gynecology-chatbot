-- Migration: Create calendar_logs table
-- Date: 2025-12-23

CREATE TABLE IF NOT EXISTS public.calendar_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    content TEXT NOT NULL,
    message_id UUID REFERENCES public.messages(id) ON DELETE SET NULL,
    source_type VARCHAR(20) DEFAULT 'chat_log', -- chat_log, symptom, ai_summary
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.calendar_logs ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can insert their own calendar logs" 
ON public.calendar_logs FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own calendar logs" 
ON public.calendar_logs FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own calendar logs" 
ON public.calendar_logs FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own calendar logs" 
ON public.calendar_logs FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_calendar_logs_user_id ON public.calendar_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_logs_date ON public.calendar_logs(date);

-- Add to Prisma's consideration (optional but good for syncing later)
COMMENT ON TABLE public.calendar_logs IS 'Table for storing AI advice and chat snippets to user calendar';
