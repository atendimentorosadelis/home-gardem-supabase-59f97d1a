
CREATE TABLE IF NOT EXISTS public.article_emotional_conclusions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid NOT NULL REFERENCES public.content_articles(id) ON DELETE CASCADE,
  conclusion_text text NOT NULL,
  generated_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(article_id)
);

ALTER TABLE public.article_emotional_conclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage conclusions"
  ON public.article_emotional_conclusions
  FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Public can read conclusions"
  ON public.article_emotional_conclusions
  FOR SELECT
  USING (true);
