CREATE POLICY "Allow anon upload for site assets"
ON storage.objects FOR INSERT
TO anon
WITH CHECK (bucket_id = 'site-assets');