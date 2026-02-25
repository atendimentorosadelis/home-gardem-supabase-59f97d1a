-- Fix "Suculentas e Cactos" article: was "jardim", should be "suculentas-cactos"
UPDATE content_articles 
SET category = 'Suculentas e Cactos', category_slug = 'suculentas-cactos'
WHERE id = '6c590dc2-64eb-4940-bf61-dc2589bc3ce1';

-- Fix "Neolítico" article: was "arquitetura", should be "neolitico"
UPDATE content_articles 
SET category = 'Neolítico', category_slug = 'neolitico'
WHERE id = 'a560f8e1-a683-4065-b515-13aae6bd44e1';

-- Fix "Varanda" article: had wrong main_subject "cozy bathroom"
UPDATE content_articles 
SET main_subject = 'cozy balcony with greenery', visual_context = 'warm and inviting balcony with wooden accents and indoor plants'
WHERE id = '4718f071-710f-4dd7-80d7-17f5ff463ce5';