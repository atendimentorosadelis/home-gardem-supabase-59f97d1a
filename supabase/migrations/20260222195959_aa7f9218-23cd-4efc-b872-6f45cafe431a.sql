
ALTER TABLE public.content_articles
  ADD COLUMN IF NOT EXISTS affiliate_banner_image text,
  ADD COLUMN IF NOT EXISTS affiliate_banner_image_mobile text,
  ADD COLUMN IF NOT EXISTS affiliate_banner_url text,
  ADD COLUMN IF NOT EXISTS main_subject text,
  ADD COLUMN IF NOT EXISTS visual_context text,
  ADD COLUMN IF NOT EXISTS gallery_prompts text[];
