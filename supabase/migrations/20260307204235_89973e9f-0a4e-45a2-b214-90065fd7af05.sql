ALTER TABLE public.content_articles ADD COLUMN IF NOT EXISTS creation_source text DEFAULT 'manual';

-- Mark existing auto-generated articles based on auto_generation_logs
UPDATE public.content_articles ca
SET creation_source = 'autopilot'
FROM public.auto_generation_logs agl
WHERE agl.article_id = ca.id AND agl.status = 'success';