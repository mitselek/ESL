-- Seed: 20 pieces + 23 param_templates
-- Kasuta: wrangler d1 execute DB --local --file=migrations/seed.sql
-- HOIATUS: Käivita ainult üks kord — korduvkäivitamisel tekivad duplikaatkirjed (ID on iga kord uus)

-- pieces (20 rida)

-- I OSA
INSERT INTO pieces (id, title, composer, section, status) VALUES
  (lower(hex(randomblob(8))), 'Laulu võim',    NULL,                  'I', 'kinnitatud'),
  (lower(hex(randomblob(8))), 'Koit',           NULL,                  'I', 'teos'),
  (lower(hex(randomblob(8))), 'Sind surmani',   NULL,                  'I', 'teos'),
  (lower(hex(randomblob(8))), 'Mis need ohjad', NULL,                  'I', 'teos'),
  (lower(hex(randomblob(8))), 'Sa oled ainus',  NULL,                  'I', 'teos');

INSERT INTO pieces (id, title, composer, section, status, notes) VALUES
  (lower(hex(randomblob(8))), 'Valgust', 'Pärt Uusberg', 'I', 'korrektuuris', 'Autoriõiguste küsimus laulupeolt lahendamata');

-- II OSA (pulmalaulud)
INSERT INTO pieces (id, title, composer, section, status) VALUES
  (lower(hex(randomblob(8))), 'Millal meie sinna saame', NULL,        'II', 'kinnitatud'),
  (lower(hex(randomblob(8))), 'Sööge langud',            'rahvaviis', 'II', 'korrektuuris'),
  (lower(hex(randomblob(8))), 'Petis peiu',              NULL,        'II', 'korrektuuris'),
  (lower(hex(randomblob(8))), 'Palju veini',             NULL,        'II', 'korrektuuris'),
  (lower(hex(randomblob(8))), 'Ei või õnneta elada',     'rahvaviis', 'II', 'kinnitatud'),
  (lower(hex(randomblob(8))), 'Kohus koju minna',        NULL,        'II', 'korrektuuris');

-- III OSA
INSERT INTO pieces (id, title, composer, section, status, notes) VALUES
  (lower(hex(randomblob(8))), 'Ilus Maa', 'Rein Rannap', 'III', 'teos', 'Vajab saateansamblit');

-- IV OSA
INSERT INTO pieces (id, title, composer, section, status) VALUES
  (lower(hex(randomblob(8))), 'Mu süda, ärka üles',          'Cyrillus Kreek',            'IV', 'korrektuuris'),
  (lower(hex(randomblob(8))), 'Lenda üles kurbtusest',        'Tõnu Kõrvits',              'IV', 'teos'),
  (lower(hex(randomblob(8))), 'Elukoor',                      'Mari Kalkun / Raho Puur',   'IV', 'teos'),
  (lower(hex(randomblob(8))), 'Tuljak',                       'Aleksander Härma',          'IV', 'teos'),
  (lower(hex(randomblob(8))), 'Mesipuu',                      'Juhan Sarapik',             'IV', 'teos'),
  (lower(hex(randomblob(8))), 'Mu isamaa',                    'Gustav Ernesaks',           'IV', 'teos'),
  (lower(hex(randomblob(8))), 'Siin meie seltsis selle aasta','Veljo Tormis',              'IV', 'korrektuuris');

-- param_templates: per_voice (16 tk)
INSERT INTO param_templates (id, name, scope, sort_order, is_default) VALUES
  (lower(hex(randomblob(8))), 'Noodikõrgused',                          'per_voice', 1,  1),
  (lower(hex(randomblob(8))), 'Pausid',                                  'per_voice', 2,  1),
  (lower(hex(randomblob(8))), 'Rütmid',                                  'per_voice', 3,  1),
  (lower(hex(randomblob(8))), 'Sõnad (tekst)',                           'per_voice', 4,  1),
  (lower(hex(randomblob(8))), 'Strihhid',                                'per_voice', 5,  1),
  (lower(hex(randomblob(8))), 'Pidekaared',                              'per_voice', 6,  1),
  (lower(hex(randomblob(8))), 'Legatokaared',                            'per_voice', 7,  1),
  (lower(hex(randomblob(8))), 'Fermaadid',                               'per_voice', 8,  1),
  (lower(hex(randomblob(8))), 'Jagunemised',                             'per_voice', 9,  1),
  (lower(hex(randomblob(8))), 'Häälerühmade paigutus süsteemides',       'per_voice', 10, 1),
  (lower(hex(randomblob(8))), 'Häälerühmade tähised süsteemi ees',       'per_voice', 11, 1),
  (lower(hex(randomblob(8))), 'Kordusmärgid',                            'per_voice', 12, 1),
  (lower(hex(randomblob(8))), 'Kordusmärgid sõnadega',                   'per_voice', 13, 1),
  (lower(hex(randomblob(8))), 'Vormiosade tähised',                      'per_voice', 14, 1),
  (lower(hex(randomblob(8))), 'Dünaamika tähised',                       'per_voice', 15, 1),
  (lower(hex(randomblob(8))), 'Dünaamika sõnadega',                      'per_voice', 16, 1);

-- param_templates: whole_piece (7 tk)
INSERT INTO param_templates (id, name, scope, sort_order, is_default) VALUES
  (lower(hex(randomblob(8))), 'Pealkiri',                                'whole_piece', 1, 1),
  (lower(hex(randomblob(8))), 'Helilooja',                               'whole_piece', 2, 1),
  (lower(hex(randomblob(8))), 'Sõnade autor',                            'whole_piece', 3, 1),
  (lower(hex(randomblob(8))), 'Tempo tähis loo alguses',                 'whole_piece', 4, 1),
  (lower(hex(randomblob(8))), 'Tempo, dünaamika jm tähised loo sees',    'whole_piece', 5, 1),
  (lower(hex(randomblob(8))), 'Täpsustavad tekstid loo sees',            'whole_piece', 6, 1),
  (lower(hex(randomblob(8))), 'Täpsustavad tekstid noodi all',           'whole_piece', 7, 1);

-- piece_params: igale noodile kõik param_templates
INSERT INTO piece_params (id, piece_id, template_id, sort_order, is_active)
SELECT lower(hex(randomblob(8))), p.id, t.id, t.sort_order, 1
FROM pieces p, param_templates t;
