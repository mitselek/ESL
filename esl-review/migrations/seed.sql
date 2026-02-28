-- Seed: kasutajad + 20 noodipalad + 23 parameetrimalli + piece_params
-- Käivitus: wrangler d1 execute esl-review --remote --file=migrations/seed.sql
-- NB: kustutab KÕIK olemasolevad andmed!

-- Puhasta (vastupidises järjekorras FK tõttu)
DELETE FROM review_entries;
DELETE FROM reviews;
DELETE FROM piece_params;
DELETE FROM piece_redactions;
DELETE FROM voice_parts;
DELETE FROM pieces;
DELETE FROM param_templates;
DELETE FROM users;

-- Kasutajad
INSERT INTO users (id, email, name) VALUES
  ('u-mihkel',  'mitselek@gmail.com',          'Mihkel'),
  ('u-august',  'august.putrinsh@gmail.com',   'August'),
  ('u-liisa',   'vesiliiv@gmail.com',          'Liisa');

-- I OSA
INSERT INTO pieces (id, title, composer, section, status) VALUES
  ('p-01', 'Laulu võim',     NULL,                  'I', 'teos'),
  ('p-02', 'Koit',           NULL,                  'I', 'teos'),
  ('p-03', 'Sind surmani',   NULL,                  'I', 'teos'),
  ('p-04', 'Mis need ohjad', NULL,                  'I', 'teos'),
  ('p-05', 'Sa oled ainus',  NULL,                  'I', 'teos');

INSERT INTO pieces (id, title, composer, section, status, notes) VALUES
  ('p-06', 'Valgust', 'Pärt Uusberg', 'I', 'teos', 'Autoriõiguste küsimus laulupeolt lahendamata');

-- II OSA (pulmalaulud)
INSERT INTO pieces (id, title, composer, section, status) VALUES
  ('p-07', 'Millal meie sinna saame', 'Veljo Tormis', 'II', 'teos'),
  ('p-08', 'Sööge langud',            'rahvaviis',    'II', 'teos'),
  ('p-09', 'Petis peiu',              NULL,           'II', 'teos'),
  ('p-10', 'Palju veini',             NULL,           'II', 'teos'),
  ('p-11', 'Ei või õnneta elada',     'rahvaviis',    'II', 'teos'),
  ('p-12', 'Kohus koju minna',        NULL,           'II', 'teos');

-- III OSA
INSERT INTO pieces (id, title, composer, section, status, notes) VALUES
  ('p-13', 'Ilus Maa', 'Rein Rannap', 'III', 'teos', 'Vajab saateansamblit');

-- IV OSA
INSERT INTO pieces (id, title, composer, section, status) VALUES
  ('p-14', 'Mu süda, ärka üles',            'Cyrillus Kreek',            'IV', 'teos'),
  ('p-15', 'Lenda üles kurbtusest',         'Tõnu Kõrvits',              'IV', 'teos'),
  ('p-16', 'Elukoor',                       'Mari Kalkun / Raho Puur',   'IV', 'teos'),
  ('p-17', 'Tuljak',                        'Aleksander Härma',          'IV', 'teos'),
  ('p-18', 'Mesipuu',                       'Juhan Sarapik',             'IV', 'teos'),
  ('p-19', 'Mu isamaa',                     'Gustav Ernesaks',           'IV', 'teos'),
  ('p-20', 'Siin meie seltsis selle aasta', 'Veljo Tormis',              'IV', 'teos');

-- param_templates: per_voice (16 tk)
INSERT INTO param_templates (id, name, scope, sort_order, is_default) VALUES
  ('t-pv01', 'Noodikõrgused',                           'per_voice', 1,  1),
  ('t-pv02', 'Pausid',                                  'per_voice', 2,  1),
  ('t-pv03', 'Rütmid',                                  'per_voice', 3,  1),
  ('t-pv04', 'Sõnad (tekst)',                           'per_voice', 4,  1),
  ('t-pv05', 'Strihhid',                                'per_voice', 5,  1),
  ('t-pv06', 'Pidekaared',                              'per_voice', 6,  1),
  ('t-pv07', 'Legatokaared',                            'per_voice', 7,  1),
  ('t-pv08', 'Fermaadid',                               'per_voice', 8,  1),
  ('t-pv09', 'Jagunemised',                             'per_voice', 9,  1),
  ('t-pv10', 'Häälerühmade paigutus süsteemides',       'per_voice', 10, 1),
  ('t-pv11', 'Häälerühmade tähised süsteemi ees',       'per_voice', 11, 1),
  ('t-pv12', 'Kordusmärgid',                            'per_voice', 12, 1),
  ('t-pv13', 'Kordusmärgid sõnadega',                   'per_voice', 13, 1),
  ('t-pv14', 'Vormiosade tähised',                      'per_voice', 14, 1),
  ('t-pv15', 'Dünaamika tähised',                       'per_voice', 15, 1),
  ('t-pv16', 'Dünaamika sõnadega',                      'per_voice', 16, 1);

-- param_templates: whole_piece (7 tk)
INSERT INTO param_templates (id, name, scope, sort_order, is_default) VALUES
  ('t-wp01', 'Pealkiri',                                'whole_piece', 1, 1),
  ('t-wp02', 'Helilooja',                               'whole_piece', 2, 1),
  ('t-wp03', 'Sõnade autor',                            'whole_piece', 3, 1),
  ('t-wp04', 'Tempo tähis loo alguses',                 'whole_piece', 4, 1),
  ('t-wp05', 'Tempo, dünaamika jm tähised loo sees',    'whole_piece', 5, 1),
  ('t-wp06', 'Täpsustavad tekstid loo sees',            'whole_piece', 6, 1),
  ('t-wp07', 'Täpsustavad tekstid noodi all',           'whole_piece', 7, 1);

-- piece_params: igale noodile kõik param_templates
INSERT INTO piece_params (id, piece_id, template_id, sort_order, is_active)
SELECT p.id || '-' || t.id, p.id, t.id, t.sort_order, 1
FROM pieces p, param_templates t;
