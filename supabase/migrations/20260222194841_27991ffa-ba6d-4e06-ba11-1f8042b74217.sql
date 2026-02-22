
-- Drop the restrictive public read policy
DROP POLICY IF EXISTS "Public can read published articles" ON public.content_articles;

-- Recreate as PERMISSIVE so public/anon users can read published articles
CREATE POLICY "Public can read published articles"
  ON public.content_articles
  FOR SELECT
  USING (status = 'published');

-- Also fix article_views - both policies are restrictive, same issue
DROP POLICY IF EXISTS "Public can read views" ON public.article_views;
CREATE POLICY "Public can read views"
  ON public.article_views
  FOR SELECT
  USING (true);
