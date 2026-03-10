
-- Drop all existing RESTRICTIVE policies on article_views
DROP POLICY IF EXISTS "Anyone can insert views" ON public.article_views;
DROP POLICY IF EXISTS "Admins can read views" ON public.article_views;
DROP POLICY IF EXISTS "Public can read views" ON public.article_views;

-- Recreate as PERMISSIVE policies (default)
CREATE POLICY "Anyone can insert views"
  ON public.article_views FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Public can read views"
  ON public.article_views FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Admins can read views"
  ON public.article_views FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
