-- Add missing columns to email_templates
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS html_template text;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS category text DEFAULT 'contact_reply';
ALTER TABLE email_templates ADD COLUMN IF NOT EXISTS is_default boolean DEFAULT false;