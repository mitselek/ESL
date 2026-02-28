-- Korrektuuri seed: Millal saame sinna maale (p-07), reviewer Mihkel
-- Andmed: Liisa Excelist (Nootide kontrollimine.xlsx)
-- Käivitus: wrangler d1 execute esl-review --remote --file=migrations/seed-review-p-07.sql

-- Häälerühmad
DELETE FROM voice_parts WHERE piece_id = 'p-07';
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-07-s', 'p-07', 'S', 1);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-07-a', 'p-07', 'A', 2);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-07-t', 'p-07', 'T', 3);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-07-b', 'p-07', 'B', 4);

-- Redaktsioonid (küljenduse versioonid)
DELETE FROM piece_redactions WHERE piece_id = 'p-07';
INSERT INTO piece_redactions (id, piece_id, url, label, created_at)
  VALUES ('red-p-07-v1', 'p-07', '/pdf/millal-saame-sinna-maale-proof.pdf', 'v1', '2026-02-28T15:58:23Z');
INSERT INTO piece_redactions (id, piece_id, url, label, created_at)
  VALUES ('red-p-07-v2', 'p-07', '/pdf/millal-saame-sinna-maale-v2.pdf', 'v2', '2026-02-28T16:53:35Z');

-- Uuenda noodi: typesetter, reviewer, pdf_url, staatus
UPDATE pieces SET
  typesetter_id = 'u-mihkel',
  reviewer_id = 'u-liisa',
  pdf_url = '/pdf/millal-saame-sinna-maale-v2.pdf',
  status = 'korrektuuris'
WHERE id = 'p-07';

-- Review (seotud v1 redaktsiooniga, completed)
DELETE FROM review_entries WHERE review_id = 'rev-p-07-mihkel';
DELETE FROM reviews WHERE id = 'rev-p-07-mihkel';
INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url, redaction_id)
  VALUES ('rev-p-07-mihkel', 'p-07', 'u-mihkel', 'completed',
    '/pdf/millal-saame-sinna-maale-proof.pdf', 'red-p-07-v1');

-- Review entries (per_voice)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-001', 'rev-p-07-mihkel', 'p-07-t-pv01', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-002', 'rev-p-07-mihkel', 'p-07-t-pv01', 'vp-p-07-a', 'ettepanek', '[{"text": "Ettepanek: takt 8 ja 15, fis-i diees puudu. See on hea meeldetuletus võtmemärgist ja lihtsustab oluliselt noodi lugemist ja harmoonia tajumist."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-003', 'rev-p-07-mihkel', 'p-07-t-pv01', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-004', 'rev-p-07-mihkel', 'p-07-t-pv01', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-005', 'rev-p-07-mihkel', 'p-07-t-pv02', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-006', 'rev-p-07-mihkel', 'p-07-t-pv02', 'vp-p-07-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-007', 'rev-p-07-mihkel', 'p-07-t-pv02', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-008', 'rev-p-07-mihkel', 'p-07-t-pv02', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-009', 'rev-p-07-mihkel', 'p-07-t-pv03', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-010', 'rev-p-07-mihkel', 'p-07-t-pv03', 'vp-p-07-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-011', 'rev-p-07-mihkel', 'p-07-t-pv03', 'vp-p-07-t', 'ettepanek', '[{"text": "Ettepanek: Takt 5 ja 13, rütmi-punktid on halvasti loetavad. Parem asukoht oleks rütmi kohal (nagu naishäältes), hetkel jäävad liiga joone peale ja märkamatuks, ebaloogiline koht, kus neid lugeda."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-012', 'rev-p-07-mihkel', 'p-07-t-pv03', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-013', 'rev-p-07-mihkel', 'p-07-t-pv04', 'vp-p-07-s', 'viga', '[{"text": "Vead: takt 15 S ja A tekst sõna \"mil-lal\" on kirjas suure algustähega, võiks olla väikese algustähega. (Sama loogika, nagu taktis 7) \nTaktid 13-16 naishäälte tekst visuaalselt madalamal, kui T oma. Võiks olla ühel kõrgusel, nagu taktides 5-8."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-014', 'rev-p-07-mihkel', 'p-07-t-pv04', 'vp-p-07-a', 'ettepanek', '[{"text": "Sopraniga sama tekst, samad ettepanekud."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-015', 'rev-p-07-mihkel', 'p-07-t-pv04', 'vp-p-07-t', 'viga', '[{"text": "Vead: takt 13 sõnas \"mei-e\" silbituskriips puudu. Igas salmis on samas kohas silbituskriips sõnades puudu.\nTakt 13 \"kus aga\" sõnade vahe liiga väike, teksti halb lugeda."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-016', 'rev-p-07-mihkel', 'p-07-t-pv04', 'vp-p-07-b', 'viga', '[{"text": "vead: takt 3 vale tekst, õige on 2x järjest “tim-pa, tim-pa”. Sama on takt 7, takt 11, takt 15."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-017', 'rev-p-07-mihkel', 'p-07-t-pv05', 'vp-p-07-a', 'ettepanek', '[{"text": "Takt 6 ja 14. Legato on kirjas S+A rea kohal ja ei ole vajadust seda aldi hääles dubleerida (nagu fermaat loo viimases taktis)"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-018', 'rev-p-07-mihkel', 'p-07-t-pv05', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-019', 'rev-p-07-mihkel', 'p-07-t-pv05', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-020', 'rev-p-07-mihkel', 'p-07-t-pv06', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-021', 'rev-p-07-mihkel', 'p-07-t-pv06', 'vp-p-07-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-022', 'rev-p-07-mihkel', 'p-07-t-pv06', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-023', 'rev-p-07-mihkel', 'p-07-t-pv06', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-024', 'rev-p-07-mihkel', 'p-07-t-pv07', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-025', 'rev-p-07-mihkel', 'p-07-t-pv08', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-026', 'rev-p-07-mihkel', 'p-07-t-pv08', 'vp-p-07-a', 'ettepanek', '[{"text": "on loetav ja arusaadav"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-027', 'rev-p-07-mihkel', 'p-07-t-pv08', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-028', 'rev-p-07-mihkel', 'p-07-t-pv08', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-029', 'rev-p-07-mihkel', 'p-07-t-pv10', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-030', 'rev-p-07-mihkel', 'p-07-t-pv10', 'vp-p-07-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-031', 'rev-p-07-mihkel', 'p-07-t-pv10', 'vp-p-07-t', 'ettepanek', '[{"text": "Ettepanek on kirjas B lahtris"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-032', 'rev-p-07-mihkel', 'p-07-t-pv10', 'vp-p-07-b', 'ettepanek', '[{"text": "ettepanek: A-osas on väga hea, et T ja B on noteeritud eraldi reale (erinevad rollid, erinevad rütmid, erinev tekst, erinevad dünaamikad). B-osas on neil sarnane roll, rütm ja sõnad on samad – siin noteeriksin T+B ühele reale. Annab paremini ülevaate ka tekkivatest harmooniatest (kus on T+B unisonis, millised intervallid häälte vahel tekivad)."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-033', 'rev-p-07-mihkel', 'p-07-t-pv11', 'vp-p-07-s', 'ettepanek', '[{"text": "Ettepanek: Häälerühma tähis süsteemi ees on arusaamatu (\"W\"). Võiks kasutada üldtuntud tähiseid, nagu S ja A."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-034', 'rev-p-07-mihkel', 'p-07-t-pv11', 'vp-p-07-a', 'ettepanek', '[{"text": "Ettepanek on kirjas S lahtris"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-035', 'rev-p-07-mihkel', 'p-07-t-pv12', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-036', 'rev-p-07-mihkel', 'p-07-t-pv12', 'vp-p-07-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-037', 'rev-p-07-mihkel', 'p-07-t-pv12', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-038', 'rev-p-07-mihkel', 'p-07-t-pv12', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-039', 'rev-p-07-mihkel', 'p-07-t-pv14', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-040', 'rev-p-07-mihkel', 'p-07-t-pv14', 'vp-p-07-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-041', 'rev-p-07-mihkel', 'p-07-t-pv14', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-042', 'rev-p-07-mihkel', 'p-07-t-pv14', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-043', 'rev-p-07-mihkel', 'p-07-t-pv15', 'vp-p-07-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-044', 'rev-p-07-mihkel', 'p-07-t-pv15', 'vp-p-07-a', 'ettepanek', '[{"text": "Takt 6 ja 14. Forte on kirjas S+A rea kohal ja ei ole vajadust seda aldi hääles dubleerida. (nagu forte tähis taktides 21 ja 25)"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-045', 'rev-p-07-mihkel', 'p-07-t-pv15', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-046', 'rev-p-07-mihkel', 'p-07-t-pv15', 'vp-p-07-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-047', 'rev-p-07-mihkel', 'p-07-t-pv16', 'vp-p-07-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-048', 'rev-p-07-mihkel', 'p-07-t-pv16', 'vp-p-07-b', 'õige', NULL);

-- Review entries (whole_piece)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-049', 'rev-p-07-mihkel', 'p-07-t-wp01', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-050', 'rev-p-07-mihkel', 'p-07-t-wp02', NULL, 'ettepanek', '[{"text": "Puudu. Originaalnoodis ka ei ole, aga kuna tegemist on eraldi noodiga, mitte terve kogumikuga, siis võiks olla kirjas ka helilooja nimi"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-051', 'rev-p-07-mihkel', 'p-07-t-wp03', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-052', 'rev-p-07-mihkel', 'p-07-t-wp04', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-07-mihkel-053', 'rev-p-07-mihkel', 'p-07-t-wp05', NULL, 'õige', NULL);

-- Uuenda staatust
UPDATE pieces SET status = 'korrektuuris', reviewer_id = 'u-mihkel' WHERE id = 'p-07';
