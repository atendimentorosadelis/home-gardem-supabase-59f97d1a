
CREATE OR REPLACE FUNCTION public.increment_article_likes(p_article_id uuid, p_ip_hash text)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  new_count INTEGER;
BEGIN
  UPDATE public.content_articles
  SET likes_count = COALESCE(likes_count, 0) + 1
  WHERE id = p_article_id;

  SELECT likes_count INTO new_count
  FROM public.content_articles
  WHERE id = p_article_id;

  RETURN COALESCE(new_count, 0);
END;
$$;
