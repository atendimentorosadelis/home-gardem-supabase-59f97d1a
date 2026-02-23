INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read access for site assets"
ON storage.objects FOR SELECT
USING (bucket_id = 'site-assets');

CREATE POLICY "Authenticated upload for site assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'site-assets');