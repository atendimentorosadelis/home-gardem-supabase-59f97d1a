
-- =============================================
-- ALL TABLES FOR HOME GARDEN ADMIN PANEL
-- =============================================

-- 1. content_articles - Main articles table
CREATE TABLE public.content_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  body TEXT,
  excerpt TEXT,
  category TEXT DEFAULT 'Decoração',
  category_slug TEXT DEFAULT 'decoracao',
  cover_image TEXT,
  gallery_images JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT '{}',
  keywords TEXT,
  read_time TEXT DEFAULT '5 min',
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  likes_count INTEGER DEFAULT 0,
  affiliate_banner_enabled BOOLEAN DEFAULT false,
  affiliate_clicks_count INTEGER DEFAULT 0,
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.content_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published articles"
  ON public.content_articles FOR SELECT
  USING (status = 'published');

CREATE POLICY "Admins can manage articles"
  ON public.content_articles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 2. article_views - Track article views
CREATE TABLE public.article_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.content_articles(id) ON DELETE CASCADE NOT NULL,
  viewer_ip TEXT,
  user_agent TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.article_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert views"
  ON public.article_views FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read views"
  ON public.article_views FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read views"
  ON public.article_views FOR SELECT
  USING (true);

-- 3. article_videos - YouTube videos linked to articles
CREATE TABLE public.article_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.content_articles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  youtube_video_id TEXT NOT NULL,
  youtube_url TEXT NOT NULL,
  video_title TEXT,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.article_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read enabled videos"
  ON public.article_videos FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage videos"
  ON public.article_videos FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4. article_images - Generated images for articles
CREATE TABLE public.article_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.content_articles(id) ON DELETE CASCADE NOT NULL,
  image_type TEXT DEFAULT 'cover' CHECK (image_type IN ('cover', 'gallery')),
  image_index INTEGER DEFAULT 0,
  prompt TEXT,
  public_url TEXT,
  format TEXT DEFAULT 'webp',
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.article_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read images"
  ON public.article_images FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage images"
  ON public.article_images FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. image_generation_queue - Queue for image generation
CREATE TABLE public.image_generation_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.content_articles(id) ON DELETE CASCADE NOT NULL,
  image_type TEXT DEFAULT 'cover' CHECK (image_type IN ('cover', 'gallery')),
  image_index INTEGER DEFAULT 0,
  prompt TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  public_url TEXT,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.image_generation_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage queue"
  ON public.image_generation_queue FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 6. notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'article')),
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own notifications"
  ON public.notifications FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can insert notifications"
  ON public.notifications FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 7. audit_logs
CREATE TABLE public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL,
  target_user_id UUID,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 8. auto_generation_config
CREATE TABLE public.auto_generation_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled BOOLEAN DEFAULT false,
  topics JSONB DEFAULT '[]'::jsonb,
  publish_immediately BOOLEAN DEFAULT true,
  daily_limit INTEGER DEFAULT 3,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.auto_generation_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage auto generation config"
  ON public.auto_generation_config FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 9. auto_generation_schedules
CREATE TABLE public.auto_generation_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  time_slot TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.auto_generation_schedules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage schedules"
  ON public.auto_generation_schedules FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 10. auto_generation_logs
CREATE TABLE public.auto_generation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.content_articles(id) ON DELETE SET NULL,
  topic_used TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'success', 'error', 'skipped')),
  error_message TEXT,
  executed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  duration_ms INTEGER
);

ALTER TABLE public.auto_generation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage generation logs"
  ON public.auto_generation_logs FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 11. affiliate_banner_clicks
CREATE TABLE public.affiliate_banner_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.content_articles(id) ON DELETE CASCADE NOT NULL,
  ip_hash TEXT,
  user_agent TEXT,
  referrer TEXT,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.affiliate_banner_clicks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert clicks"
  ON public.affiliate_banner_clicks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can read clicks"
  ON public.affiliate_banner_clicks FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 12. site_settings - Key-value settings store
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings"
  ON public.site_settings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can read settings"
  ON public.site_settings FOR SELECT
  USING (true);

-- 13. newsletter_subscribers
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.newsletter_subscribers FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage subscribers"
  ON public.newsletter_subscribers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Subscribers can unsubscribe"
  ON public.newsletter_subscribers FOR UPDATE
  USING (true);

-- 14. contact_messages
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  replied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can send messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can manage messages"
  ON public.contact_messages FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 15. email_templates
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  template_type TEXT DEFAULT 'newsletter',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates"
  ON public.email_templates FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 16. RPC: register_affiliate_click
CREATE OR REPLACE FUNCTION public.register_affiliate_click(
  p_article_id UUID,
  p_ip_hash TEXT,
  p_user_agent TEXT,
  p_referrer TEXT DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  click_count INTEGER;
BEGIN
  INSERT INTO public.affiliate_banner_clicks (article_id, ip_hash, user_agent, referrer)
  VALUES (p_article_id, p_ip_hash, p_user_agent, p_referrer);

  UPDATE public.content_articles
  SET affiliate_clicks_count = COALESCE(affiliate_clicks_count, 0) + 1
  WHERE id = p_article_id;

  SELECT affiliate_clicks_count INTO click_count
  FROM public.content_articles WHERE id = p_article_id;

  RETURN click_count;
END;
$$;

-- 17. Enable realtime for notifications and auto_generation_logs
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.auto_generation_logs;

-- 18. Create indexes for performance
CREATE INDEX idx_content_articles_status ON public.content_articles(status);
CREATE INDEX idx_content_articles_slug ON public.content_articles(slug);
CREATE INDEX idx_content_articles_published_at ON public.content_articles(published_at);
CREATE INDEX idx_article_views_article_id ON public.article_views(article_id);
CREATE INDEX idx_article_views_viewed_at ON public.article_views(viewed_at);
CREATE INDEX idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX idx_affiliate_clicks_article_id ON public.affiliate_banner_clicks(article_id);
