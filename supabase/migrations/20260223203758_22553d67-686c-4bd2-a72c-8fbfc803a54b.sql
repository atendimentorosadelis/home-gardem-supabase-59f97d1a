-- Reclassify all existing articles to specific categories

-- Escritório
UPDATE content_articles SET category = 'Escritório', category_slug = 'escritorio' WHERE id = '2d175264-e81e-4789-9525-9f019413188a';

-- Quarto
UPDATE content_articles SET category = 'Quarto', category_slug = 'quarto' WHERE id IN ('8992f347-ee14-4cf0-9197-75cfae8b6c48', 'd9216a36-4331-452c-9af8-868c228e10b3', 'ba560bb2-79cb-4bb4-b742-e8eaae7055dc');

-- Moderno
UPDATE content_articles SET category = 'Moderno', category_slug = 'moderno' WHERE id IN ('a74efd8c-fde7-40cd-a988-340a9295d3b1', '5709b4a1-7338-4457-afb4-3637389b07b2');

-- Colonial
UPDATE content_articles SET category = 'Colonial', category_slug = 'colonial' WHERE id IN ('d0699cae-4f30-4ad2-85c1-217f9758bca2', '857b9350-b3b7-4474-a135-8a14dcd4d845');

-- Hidroponia
UPDATE content_articles SET category = 'Hidroponia', category_slug = 'hidroponia' WHERE id IN ('ca3f3243-eb48-4d03-bd59-1b3d3a7aac26', 'e6f69dae-df47-4cd1-86e1-465d9abab0ce', '1245288d-ac5f-4bb2-bed5-7c2855473dcd');

-- Piscina
UPDATE content_articles SET category = 'Piscina', category_slug = 'piscina' WHERE id IN ('38f7650d-abb2-4f01-aa2d-50a40f607b3f', '7e1b08b5-9dec-4b14-9031-f74fcb51a09c', 'e42e616c-3c3b-49b5-9bba-f28a19a67d4f', '980f4436-86bc-402f-976d-bc0543ab861b');

-- Paisagismo
UPDATE content_articles SET category = 'Paisagismo', category_slug = 'paisagismo' WHERE id IN ('400c36c9-ef30-4549-9947-91b2efa623ad', '7d47e00c-5c74-4807-9b5a-1929895847b0');

-- Banheiro
UPDATE content_articles SET category = 'Banheiro', category_slug = 'banheiro' WHERE id IN ('3b1101d4-abc6-4dfa-b866-54366a96b57f', '993696be-00e2-45a2-aba1-d88df2cbf3c1', '57ec3ffa-b03e-4b10-b8a3-448eaa036a3e');

-- Sala
UPDATE content_articles SET category = 'Sala', category_slug = 'sala' WHERE id IN ('29c574ea-7074-4ecf-bcd2-c216a25d868a', 'af5dbfe6-1e28-40cb-aa5f-299b1779a144', 'fd28f9d1-c927-4ec9-b1f7-f4b14bf949e7', '7c4d09e3-61b7-40e5-94ec-13e7f1e804d6', '58e32df1-3a02-414d-9250-b816d4cb5145');

-- Cozinha
UPDATE content_articles SET category = 'Cozinha', category_slug = 'cozinha' WHERE id IN ('b509d2cf-0958-4613-a619-ce17fef71220', '320555d3-81eb-4cf9-8cf8-c458c4c33171');

-- Área de Serviço
UPDATE content_articles SET category = 'Área de Serviço', category_slug = 'area-de-servico' WHERE id = '297c8bed-05c0-4238-ad63-30e7e65a738d';

-- Europeu
UPDATE content_articles SET category = 'Europeu', category_slug = 'europeu' WHERE id = '3d1954f6-9087-46bf-8839-f6c8a3e58a51';

-- Cuidados com Plantação
UPDATE content_articles SET category = 'Cuidados com Plantação', category_slug = 'cuidados-plantacao' WHERE id IN ('1082e286-9aa2-484b-859f-9b83cfa19aeb', 'd67740a4-2c5b-4c5c-800f-82e010bb76d7', 'cc4a6c05-bd27-4d59-8837-5c68490a7f94');

-- Flores Ornamentais
UPDATE content_articles SET category = 'Flores Ornamentais', category_slug = 'flores-ornamentais' WHERE id = '0c45b859-4dac-49ca-b574-3f85e452f225';

-- Sala de Jantar
UPDATE content_articles SET category = 'Sala de Jantar', category_slug = 'sala-de-jantar' WHERE id IN ('f35d15d7-b71d-45e9-a709-ebfff4bce31b', '4a4e99ec-c532-4204-9a18-d7cc50ed1ff7');

-- Área Gourmet
UPDATE content_articles SET category = 'Área Gourmet', category_slug = 'area-gourmet' WHERE id IN ('9d1efa96-22fd-469f-a311-69663c01a906', '7d0da756-98f6-4761-8258-8b264d48d08b', '9c81ea7c-d222-48a5-b501-17622a7e60c9');

-- Horta de Ervas
UPDATE content_articles SET category = 'Horta de Ervas', category_slug = 'horta-de-ervas' WHERE id = '44536a66-73b5-4457-ad81-8e5aadb8494b';

-- Lareira
UPDATE content_articles SET category = 'Lareira', category_slug = 'lareira' WHERE id = '0c15cf99-efb3-49d7-8184-8a1ff6072c9f';

-- Varanda
UPDATE content_articles SET category = 'Varanda', category_slug = 'varanda' WHERE id = '4718f071-710f-4dd7-80d7-17f5ff463ce5';