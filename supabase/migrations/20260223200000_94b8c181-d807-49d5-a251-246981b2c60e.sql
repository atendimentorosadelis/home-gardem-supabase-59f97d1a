
-- Create page_views table to track ALL page views across the site
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  page_path text NOT NULL,
  page_title text,
  referrer text,
  user_agent text,
  viewer_hash text,
  viewed_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;

-- Anyone can insert page views
CREATE POLICY "Anyone can insert page views"
  ON public.page_views FOR INSERT
  WITH CHECK (true);

-- Admins can read page views
CREATE POLICY "Admins can read page views"
  ON public.page_views FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Create index for performance
CREATE INDEX idx_page_views_viewed_at ON public.page_views (viewed_at DESC);
CREATE INDEX idx_page_views_page_path ON public.page_views (page_path);
