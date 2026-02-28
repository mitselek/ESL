-- Liisa korrektuuri seed: Sööge, langud (p-08)
-- Genereeritud automaatselt failist: Nootide kontrollimine.xlsx
-- Käivitus: wrangler d1 execute esl-review --remote --file=migrations/seed-review-p-08.sql

-- Häälerühmad
DELETE FROM voice_parts WHERE piece_id = 'p-08';
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-08-s', 'p-08', 'S', 1);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-08-a', 'p-08', 'A', 2);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-08-t', 'p-08', 'T', 3);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-08-b', 'p-08', 'B', 4);

-- Review
DELETE FROM review_entries WHERE review_id = 'rev-p-08-liisa';
DELETE FROM reviews WHERE id = 'rev-p-08-liisa';
INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url, redaction_id)
  SELECT 'rev-p-08-liisa', 'p-08', 'u-liisa', 'completed',
    COALESCE((SELECT url FROM piece_redactions WHERE piece_id = 'p-08' LIMIT 1), '/pdf/missing'),
    (SELECT id FROM piece_redactions WHERE piece_id = 'p-08' LIMIT 1);

-- Review entries (per_voice)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-001', 'rev-p-08-liisa', 'p-08-t-pv01', 'vp-p-08-s', 'viga', '[{"text": "Viga: takt 13, 1.löögi viimane 16-ndik on hetkel si-noot. Õige on  do-noot (c2)."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-002', 'rev-p-08-liisa', 'p-08-t-pv01', 'vp-p-08-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-003', 'rev-p-08-liisa', 'p-08-t-pv01', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-004', 'rev-p-08-liisa', 'p-08-t-pv01', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-005', 'rev-p-08-liisa', 'p-08-t-pv02', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-006', 'rev-p-08-liisa', 'p-08-t-pv02', 'vp-p-08-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-007', 'rev-p-08-liisa', 'p-08-t-pv02', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-008', 'rev-p-08-liisa', 'p-08-t-pv02', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-009', 'rev-p-08-liisa', 'p-08-t-pv03', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-010', 'rev-p-08-liisa', 'p-08-t-pv03', 'vp-p-08-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-011', 'rev-p-08-liisa', 'p-08-t-pv03', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-012', 'rev-p-08-liisa', 'p-08-t-pv03', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-013', 'rev-p-08-liisa', 'p-08-t-pv04', 'vp-p-08-s', 'ettepanek', '[{"text": "Ettepanek: takt 39, kõikidel häälerühmadel suurem vahe sõnade \"oleme\" ja \"hoolsad\" vahele. Hetkel liiga koos ja raske lugeda. Sõnas \"hoolsad\" -sad silp silbituskriipsust veidi eemale nihutada. Hetkel on silp kriipsuga liiga koos ja raske lugeda. \nTakti 43-44 on samuti sõnad liiga koos, aga siin ei saa teisiti teha, sest muidu läheb noot pikemaks. Praegune süsteemide asetus on hea. \nTakt 71-81, kõikides häälerühmades sõnade \"maha\" ja \"siis\" vahele suurem vahe. Hetkel liiga koos ja raske lugeda. \nViga: takt 45, kõikidel häälerühmadel esimese sõna \"kavalad\" viimases silbis on a-täht puudu. \nTAkt 75, kõikides häälerühmades sõna \"maha\" suure algustähega. Õige on väikese algustähega. \n\nTakt 10, takt 14, hüüumärk puudu (hetkel on koma). \nTAkt 47, väike algustäht. Õige on suur algustäht.\nTakt 50, vale sõna. Õige on \"meie\".\nTakt 79, suur algustäht. Õige on väikese algustähega."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-014', 'rev-p-08-liisa', 'p-08-t-pv04', 'vp-p-08-a', 'viga', '[{"text": "Viga: takt 47, väike algustäht. Õige on suur algustäht. \nTakt 50 vale sõna. Õige on \"meie\".\nTakt 80, suur algustäht. Õige on väikese algustähega."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-015', 'rev-p-08-liisa', 'p-08-t-pv04', 'vp-p-08-t', 'viga', '[{"text": "Viga: takt 5, takt 9, sõna \"söö-ge\" on suure algustähega. Õige on väikese algustähega. \nTakt 12, hüüumärk puudu. Praegu on kirjas koma, õige on selle asemel hüüumärk.\nTakt 62, viimase sõna järel on koma puudu.\nTakt 47, sõna järelt on koma puudu.\nTakt 48, vale sõna. Õige on \"mei-e\".\nTakt 62, takti lõpust koma puudu. \n\n\nTakt 31-32, hüüumärk ja suur algustäht on õige parandus võrreldes originaaliga. \nTakt 58, takti lõpus koma on õige."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-016', 'rev-p-08-liisa', 'p-08-t-pv04', 'vp-p-08-b', 'viga', '[{"text": "Viga: takt 5, takt 9, sõna \"söö-ge\" on suure algustähega. Õige on väikese algustähega. \nTakt 12, hüüumärk puudu. Praegu on kirjas koma, õige on selle asemel hüüumärk.\nTakt 62, viimase sõna järel on koma puudu."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-017', 'rev-p-08-liisa', 'p-08-t-pv05', 'vp-p-08-s', 'viga', '[{"text": "Viga: takt 85-86, kõikides häälerühmades rõhkude asukoht silbil \"sai-\" on vales kohas (taktis 85). Õige on rõhk takti 86 esimesel 8-ndikul."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-018', 'rev-p-08-liisa', 'p-08-t-pv05', 'vp-p-08-a', 'viga', '[{"text": "Viga on kirjas S lahtris."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-019', 'rev-p-08-liisa', 'p-08-t-pv05', 'vp-p-08-t', 'viga', '[{"text": "Viga on kirjas S lahtris."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-020', 'rev-p-08-liisa', 'p-08-t-pv05', 'vp-p-08-b', 'viga', '[{"text": "Viga on kirjas S lahtris."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-021', 'rev-p-08-liisa', 'p-08-t-pv06', 'vp-p-08-s', 'viga', '[{"text": "Viga: Takt 21, pidekaar sõnal \"ärge\". Õige on ilma pidekaareta."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-022', 'rev-p-08-liisa', 'p-08-t-pv06', 'vp-p-08-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-023', 'rev-p-08-liisa', 'p-08-t-pv06', 'vp-p-08-t', 'viga', '[{"text": "Viga: Takt 21, pidekaar sõnal \"ärge\". Õige on ilma pidekaareta."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-024', 'rev-p-08-liisa', 'p-08-t-pv06', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-025', 'rev-p-08-liisa', 'p-08-t-pv07', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-026', 'rev-p-08-liisa', 'p-08-t-pv07', 'vp-p-08-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-027', 'rev-p-08-liisa', 'p-08-t-pv07', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-028', 'rev-p-08-liisa', 'p-08-t-pv07', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-029', 'rev-p-08-liisa', 'p-08-t-pv08', 'vp-p-08-s', 'viga', '[{"text": "Vead: Takt 38, takt 42, kõikides häälerühmades fermaat ei ole kohakuti hingamiskomaga. Õige on see, kui koma on visuaalselt täpselt fermaadi all.\nTakt 70, fermaatide alt hingamiskoma puudu"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-030', 'rev-p-08-liisa', 'p-08-t-pv08', 'vp-p-08-a', 'viga', '[{"text": "Viga on kirjas S lahtris."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-031', 'rev-p-08-liisa', 'p-08-t-pv08', 'vp-p-08-t', 'viga', '[{"text": "Viga on kirjas S lahtris."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-032', 'rev-p-08-liisa', 'p-08-t-pv08', 'vp-p-08-b', 'viga', '[{"text": "Viga on kirjas S lahtris."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-033', 'rev-p-08-liisa', 'p-08-t-pv09', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-034', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-035', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-a', 'viga', '[{"text": "Viga: takt 21, forte tähis puudu."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-036', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-037', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-038', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-039', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-040', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-041', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-b', 'õige', NULL);
-- SKIP: Muud märgid (pole meie süsteemis)

-- Review entries (whole_piece)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-042', 'rev-p-08-liisa', 'p-08-t-wp01', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-043', 'rev-p-08-liisa', 'p-08-t-wp02', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-044', 'rev-p-08-liisa', 'p-08-t-wp03', NULL, 'ettepanek', '[{"text": "Ettepanek: kirjutaksin pealkirja alla sulgudesse \"Kihnu\", sest see on kogumikust välja võetu noot ja nii ei ole teada, et tegemist on \"Kihnu\" loo ja tekstiga. Selliselt on \"tekstiautor\" ka kirjas."}]');
-- SKIP: Helistik (pole meie süsteemis)
-- SKIP: Taktimõõt (pole meie süsteemis)
-- SKIP: Häälte paigutus süsteemides (pole meie süsteemis)
-- SKIP: Häälerühmade tähised süsteemi ees (pole meie süsteemis)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-045', 'rev-p-08-liisa', 'p-08-t-wp04', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-046', 'rev-p-08-liisa', 'p-08-t-wp05', NULL, 'viga', '[{"text": "Viga: takt 63. Puudu on tempotähis (sõnadega): poco a poco accelerando.\nTakt 73. Tempo kirjeldus on vale takti kohal. Õige on poco a poco accelerando al fine takti 73 kohal (hetkel on takti 71 kohal, mis tekitab kiirenduse takt varem)"}]');
-- SKIP: vormiosade tähised (pole meie süsteemis)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-047', 'rev-p-08-liisa', 'p-08-t-wp07', NULL, 'ettepanek', '[{"text": "Ettepanek: Viimane takt, kirjas on loo valmimisaasta, aga see info võiks olla viimase süsteemi all. Hetkel mõjub see nagu B häälerühmale mõeldud juhis. Puudu on teine aastaarv, õige on \"1959/1994\""}]');

-- Uuenda staatust
UPDATE pieces SET status = 'korrektuuris', reviewer_id = 'u-liisa' WHERE id = 'p-08';
