CREATE TABLE IF NOT EXISTS public.newsletter_send_history (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  article_id uuid REFERENCES public.content_articles(id),
  article_title text NOT NULL DEFAULT '',
  article_slug text,
  sent_at timestamp with time zone NOT NULL DEFAULT now(),
  total_recipients integer NOT NULL DEFAULT 0,
  successful_sends integer NOT NULL DEFAULT 0,
  failed_sends integer NOT NULL DEFAULT 0,
  opened_count integer NOT NULL DEFAULT 0,
  clicked_count integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  error_message text
);

ALTER TABLE public.newsletter_send_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage send history" ON public.newsletter_send_history FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
