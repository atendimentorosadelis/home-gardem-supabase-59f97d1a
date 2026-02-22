UPDATE site_settings 
SET value = jsonb_set(
  jsonb_set(
    jsonb_set(
      jsonb_set(
        jsonb_set(
          COALESCE(value, '{}'::jsonb),
          '{og_description}', '"Home Garden Manual - Your complete guide to decoration, architecture, modern design, and gardening. Inspiration to transform every space."'::jsonb
        ),
        '{og_title}', '"Home Garden Manual - Decoration, Architecture, Design & Gardening"'::jsonb
      ),
      '{og_image}', '"/og-image.jpg"'::jsonb
    ),
    '{twitter_image}', '"/og-image.jpg"'::jsonb
  ),
  '{meta_description}', '"Your complete guide to decoration, architecture, modern design, and gardening. Inspiration and tips to transform every space in your home."'::jsonb
),
updated_at = now()
WHERE key = 'seo_settings';