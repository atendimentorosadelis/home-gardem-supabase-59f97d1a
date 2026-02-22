
-- generation_history table
CREATE TABLE public.generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  article_title TEXT,
  article_id UUID REFERENCES public.content_articles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'success',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.generation_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage generation history" ON public.generation_history FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- commemorative_date_settings table
CREATE TABLE public.commemorative_date_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date_id TEXT NOT NULL UNIQUE,
  is_enabled BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.commemorative_date_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can manage commemorative settings" ON public.commemorative_date_settings FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Public can read commemorative settings" ON public.commemorative_date_settings FOR SELECT USING (true);
