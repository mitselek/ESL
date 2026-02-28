-- Liisa korrektuuri seed: Ei või õnneta elada (p-11)
-- Genereeritud automaatselt failist: Nootide kontrollimine.xlsx
-- Käivitus: wrangler d1 execute esl-review --remote --file=migrations/seed-review-p-11.sql

-- Häälerühmad
DELETE FROM voice_parts WHERE piece_id = 'p-11';
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-11-s', 'p-11', 'S', 1);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-11-a', 'p-11', 'A', 2);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-11-t', 'p-11', 'T', 3);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-11-b', 'p-11', 'B', 4);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-11-soolo', 'p-11', 'soolo', 5);

-- Review
DELETE FROM review_entries WHERE review_id = 'rev-p-11-liisa';
DELETE FROM reviews WHERE id = 'rev-p-11-liisa';
INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url, redaction_id)
  SELECT 'rev-p-11-liisa', 'p-11', 'u-liisa', 'completed',
    COALESCE((SELECT url FROM piece_redactions WHERE piece_id = 'p-11' LIMIT 1), '/pdf/missing'),
    (SELECT id FROM piece_redactions WHERE piece_id = 'p-11' LIMIT 1);

-- Review entries (per_voice)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-001', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-002', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-003', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-004', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-005', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-soolo', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-006', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-007', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-008', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-009', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-010', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-soolo', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-011', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-s', 'ettepanek', '[{"text": "Ettepanek: takt 13, takt 17, sõnade vahel liiga väike vahe. Raske teksti lugeda."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-012', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-013', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-014', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-015', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-soolo', 'viga', '[{"text": "Viga:  takt 35 topelt L-häälik. Õige on \"kü-la\".\nTakt 50, takt 54, sõnade vahel liiga väike vahe. Teksti raske lugeda."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-016', 'rev-p-11-liisa', 'p-11-t-pv05', 'vp-p-11-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-017', 'rev-p-11-liisa', 'p-11-t-pv05', 'vp-p-11-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-018', 'rev-p-11-liisa', 'p-11-t-pv05', 'vp-p-11-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-019', 'rev-p-11-liisa', 'p-11-t-pv05', 'vp-p-11-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-020', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-s', 'viga', '[{"text": "V: Takt 13, takt 17, pidekaar on üleliigne. Sõnas \"kü-la\" on 2 silpi, pidekaar annab mõista, et on 1 silp. Mõistan, et punktiirpide eesmärk on edasi anda laulmistunnetust, aga seda õpetab dirigent proovis ja seda noodis dubleerida ei ole vaja. Pidekaared annavad infot rütmi kohta."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-021', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-022', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-023', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-024', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-soolo', 'viga', '[{"text": "V: takt 33, pidekaar on üleliigne.  Sõnas \"jää-gu\" on 2 silpi, pidekaar annab mõista, et on 1 silp."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-025', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-026', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-027', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-028', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-029', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-soolo', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-030', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-s', 'ettepanek', '[{"text": "Ettepanek:  takt 87, kõikides häältes, cresc kahvel algab originaalnoodis takt 86 lõpust. Kuna uues noodis jääb taktide üleminek reavahetusele, siis ei oleks kahvel üle rea arusaadavalt loetav, aga selles taktis võiks kahvli veel paar millimeetrit takti alguseni välja venitada, et oleks aru saada, et crescendo tekib läbi motiivi, mitte rõhutatult 87. takti esimesest löögist."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-031', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-a', 'ettepanek', '[{"text": "Ettepanek on S lahtris."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-032', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-t', 'ettepanek', '[{"text": "Ettepanek on S lahtris"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-033', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-b', 'ettepanek', '[{"text": "Ettepanek on S lahtris"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-034', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-soolo', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-035', 'rev-p-11-liisa', 'p-11-t-pv16', 'vp-p-11-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-036', 'rev-p-11-liisa', 'p-11-t-pv16', 'vp-p-11-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-037', 'rev-p-11-liisa', 'p-11-t-pv16', 'vp-p-11-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-038', 'rev-p-11-liisa', 'p-11-t-pv16', 'vp-p-11-b', 'õige', NULL);

-- Review entries (whole_piece)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-039', 'rev-p-11-liisa', 'p-11-t-wp01', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-040', 'rev-p-11-liisa', 'p-11-t-wp02', NULL, 'ettepanek', '[{"text": "olemas, õige\nEttepanek: soovi korral võib lisada eludaatumid, aga ei pea"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-041', 'rev-p-11-liisa', 'p-11-t-wp03', NULL, 'ettepanek', '[{"text": "Ettepanek: kirjutaksin pealkirja alla sulgudesse \"Kihnu\", sest see on kogumikust välja võetu noot ja nii ei ole teada, et tegemist on \"Kihnu\" loo ja tekstiga. Selliselt on lisaks teksti seadjale kirjas ka teksti originaalpäritolu."}]');
-- SKIP: Helistik (pole meie süsteemis)
-- SKIP: Taktimõõt (pole meie süsteemis)
-- SKIP: Häälte paigutus süsteemides (pole meie süsteemis)
-- SKIP: Häälerühmade tähised süsteemi ees (pole meie süsteemis)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-11-liisa-042', 'rev-p-11-liisa', 'p-11-t-wp04', NULL, 'õige', NULL);
-- SKIP: vormiosade tähised (pole meie süsteemis)

-- Uuenda staatust
UPDATE pieces SET status = 'korrektuuris', reviewer_id = 'u-liisa' WHERE id = 'p-11';
