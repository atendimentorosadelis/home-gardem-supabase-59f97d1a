CREATE POLICY "Public read article-images" ON storage.objects FOR SELECT USING (bucket_id = 'article-images');

CREATE POLICY "Authenticated users can upload article-images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'article-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update article-images" ON storage.objects FOR UPDATE USING (bucket_id = 'article-images' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete article-images" ON storage.objects FOR DELETE USING (bucket_id = 'article-images' AND auth.role() = 'authenticated');