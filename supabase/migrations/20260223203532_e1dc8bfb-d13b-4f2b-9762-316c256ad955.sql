-- Remove default 'Decoração' from content_articles columns
ALTER TABLE content_articles ALTER COLUMN category DROP DEFAULT;
ALTER TABLE content_articles ALTER COLUMN category_slug DROP DEFAULT;