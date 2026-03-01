-- Korrektuuri seed: Sööge langud (p-08), reviewer Liisa
-- Andmed: Liisa Excelist (Nootide kontrollimine.xlsx)
-- Käivitus: wrangler d1 execute esl-review --remote --file=migrations/seed-review-p-08.sql

-- Häälerühmad
DELETE FROM voice_parts WHERE piece_id = 'p-08';
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-08-s', 'p-08', 'S', 1);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-08-a', 'p-08', 'A', 2);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-08-t', 'p-08', 'T', 3);
INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES ('vp-p-08-b', 'p-08', 'B', 4);

-- Redaktsioon (küljenduse versioon)
DELETE FROM piece_redactions WHERE piece_id = 'p-08';
INSERT INTO piece_redactions (id, piece_id, url, label, created_at)
  VALUES ('red-p-08-v1', 'p-08', '/pdf/sooge-langud-proof.pdf', 'v1', '2026-02-28T18:00:00Z');

-- Uuenda noodi: typesetter, reviewer, pdf_url, staatus
UPDATE pieces SET
  typesetter_id = 'u-mihkel',
  reviewer_id = 'u-liisa',
  pdf_url = '/pdf/sooge-langud-proof.pdf',
  status = 'paranduses',
  pageflow_matched = 1
WHERE id = 'p-08';

-- Review (seotud v1 redaktsiooniga, completed)
DELETE FROM review_entries WHERE review_id = 'rev-p-08-liisa';
DELETE FROM reviews WHERE id = 'rev-p-08-liisa';
INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url, redaction_id)
  VALUES ('rev-p-08-liisa', 'p-08', 'u-liisa', 'completed',
    '/pdf/sooge-langud-proof.pdf', 'red-p-08-v1');

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
  VALUES ('re-p-08-liisa-033', 'rev-p-08-liisa', 'p-08-t-pv09', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-034', 'rev-p-08-liisa', 'p-08-t-pv09', 'vp-p-08-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-035', 'rev-p-08-liisa', 'p-08-t-pv09', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-036', 'rev-p-08-liisa', 'p-08-t-pv09', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-037', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-038', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-a', 'viga', '[{"text": "Viga: takt 21, forte tähis puudu."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-039', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-040', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-041', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-042', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-a', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-043', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-044', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-b', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-045', 'rev-p-08-liisa', 'p-08-t-pv17', 'vp-p-08-s', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-046', 'rev-p-08-liisa', 'p-08-t-pv17', 'vp-p-08-a', 'viga', '[{"text": "Viga: takt 55, takt 63, takt 75, noole asukoht ja asend vale. Õige on see, kui nool paikneb noodipeast all pool, diagonaalis nii et noodi pea juhib tähelepanu aldi partiile. Sellega antakse märku, et meloodialiin liigub selle koha peal mööda aldipartiid."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-047', 'rev-p-08-liisa', 'p-08-t-pv17', 'vp-p-08-t', 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-048', 'rev-p-08-liisa', 'p-08-t-pv17', 'vp-p-08-b', 'viga', '[{"text": "Viga: takt 59, noole asukoht ja asend vale. Õige on see, kui nool paikneb noodipeast all pool, diagonaalis nii et noodi pea juhib tähelepanu bassi partiile. Sellega antakse märku, et meloodialiin liigub selle koha peal mööda bassipartiid."}]');

-- Review entries (whole_piece)
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-049', 'rev-p-08-liisa', 'p-08-t-wp01', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-050', 'rev-p-08-liisa', 'p-08-t-wp02', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-051', 'rev-p-08-liisa', 'p-08-t-wp03', NULL, 'ettepanek', '[{"text": "Ettepanek: kirjutaksin pealkirja alla sulgudesse \"Kihnu\", sest see on kogumikust välja võetu noot ja nii ei ole teada, et tegemist on \"Kihnu\" loo ja tekstiga. Selliselt on \"tekstiautor\" ka kirjas."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-052', 'rev-p-08-liisa', 'p-08-t-wp08', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-053', 'rev-p-08-liisa', 'p-08-t-wp09', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-054', 'rev-p-08-liisa', 'p-08-t-pv10', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-055', 'rev-p-08-liisa', 'p-08-t-pv11', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-056', 'rev-p-08-liisa', 'p-08-t-wp04', NULL, 'õige', NULL);
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-057', 'rev-p-08-liisa', 'p-08-t-wp05', NULL, 'viga', '[{"text": "Viga: takt 63. Puudu on tempotähis (sõnadega): poco a poco accelerando.\nTakt 73. Tempo kirjeldus on vale takti kohal. Õige on poco a poco accelerando al fine takti 73 kohal (hetkel on takti 71 kohal, mis tekitab kiirenduse takt varem)"}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-058', 'rev-p-08-liisa', 'p-08-t-pv14', NULL, 'viga', '[{"text": "Viga:  kasti sees olevad numbrid on segadust tekitavad. Tavaliselt on nendes kastides kirjas taktinumbrid. Praegu noodis olevad numbrid ei vasta taktinumbritele, see tekitab partii õppimisel segadust ja ei aita ka vormiliselt nooti lugeda. Originaalnoodis sedalaadi vormitähised puuduvad ja mina võtaksin need ka uuesti trükitud noodist ära."}]');
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
  VALUES ('re-p-08-liisa-059', 'rev-p-08-liisa', 'p-08-t-wp07', NULL, 'ettepanek', '[{"text": "Ettepanek: Viimane takt, kirjas on loo valmimisaasta, aga see info võiks olla viimase süsteemi all. Hetkel mõjub see nagu B häälerühmale mõeldud juhis. Puudu on teine aastaarv, õige on \"1959/1994\""}]');
