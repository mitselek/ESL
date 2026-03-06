-- 0005_excel-migration.sql
-- Excel review data migration (2026-03-06)
-- GH issues: #2 (epic), #3 (N/A verdict), #4 (template), #5 (scope), #6, #7, #9

-- =============================================================================
-- 1. param_templates: add Võtmed, change 5 templates to whole_piece scope
-- =============================================================================

INSERT OR IGNORE INTO param_templates (id, name, scope, sort_order, is_default)
VALUES ('t-wp10', 'Võtmed', 'whole_piece', 10, 1);

UPDATE param_templates SET scope = 'whole_piece', sort_order = 11 WHERE id = 't-pv10';
UPDATE param_templates SET scope = 'whole_piece', sort_order = 12 WHERE id = 't-pv11';
UPDATE param_templates SET scope = 'whole_piece', sort_order = 13 WHERE id = 't-pv12';
UPDATE param_templates SET scope = 'whole_piece', sort_order = 14 WHERE id = 't-pv13';
UPDATE param_templates SET scope = 'whole_piece', sort_order = 15 WHERE id = 't-pv14';

-- =============================================================================
-- 2. piece_params: add t-wp10 for all 20 pieces
-- =============================================================================

INSERT INTO piece_params (id, piece_id, template_id, sort_order, is_active)
SELECT 'pp-' || p.id || '-t-wp10', p.id, 't-wp10', 10, 1
FROM pieces p
WHERE NOT EXISTS (
  SELECT 1 FROM piece_params pp WHERE pp.piece_id = p.id AND pp.template_id = 't-wp10'
);

-- =============================================================================
-- 3. voice_parts: add S/A/T/B for all pieces missing them
-- =============================================================================

INSERT OR IGNORE INTO voice_parts (id, piece_id, name, sort_order) VALUES
('vp-p-01-s', 'p-01', 'S', 1), ('vp-p-01-a', 'p-01', 'A', 2), ('vp-p-01-t', 'p-01', 'T', 3), ('vp-p-01-b', 'p-01', 'B', 4),
('vp-p-02-s', 'p-02', 'S', 1), ('vp-p-02-a', 'p-02', 'A', 2), ('vp-p-02-t', 'p-02', 'T', 3), ('vp-p-02-b', 'p-02', 'B', 4),
('vp-p-03-s', 'p-03', 'S', 1), ('vp-p-03-a', 'p-03', 'A', 2), ('vp-p-03-t', 'p-03', 'T', 3), ('vp-p-03-b', 'p-03', 'B', 4),
('vp-p-04-s', 'p-04', 'S', 1), ('vp-p-04-a', 'p-04', 'A', 2), ('vp-p-04-t', 'p-04', 'T', 3), ('vp-p-04-b', 'p-04', 'B', 4),
('vp-p-09-s', 'p-09', 'S', 1), ('vp-p-09-a', 'p-09', 'A', 2), ('vp-p-09-t', 'p-09', 'T', 3), ('vp-p-09-b', 'p-09', 'B', 4),
('vp-p-10-s', 'p-10', 'S', 1), ('vp-p-10-a', 'p-10', 'A', 2), ('vp-p-10-t', 'p-10', 'T', 3), ('vp-p-10-b', 'p-10', 'B', 4),
('vp-p-13-s', 'p-13', 'S', 1), ('vp-p-13-a', 'p-13', 'A', 2), ('vp-p-13-t', 'p-13', 'T', 3), ('vp-p-13-b', 'p-13', 'B', 4),
('vp-p-14-s', 'p-14', 'S', 1), ('vp-p-14-a', 'p-14', 'A', 2), ('vp-p-14-t', 'p-14', 'T', 3), ('vp-p-14-b', 'p-14', 'B', 4),
('vp-p-15-s', 'p-15', 'S', 1), ('vp-p-15-a', 'p-15', 'A', 2), ('vp-p-15-t', 'p-15', 'T', 3), ('vp-p-15-b', 'p-15', 'B', 4),
('vp-p-16-s', 'p-16', 'S', 1), ('vp-p-16-a', 'p-16', 'A', 2), ('vp-p-16-t', 'p-16', 'T', 3), ('vp-p-16-b', 'p-16', 'B', 4),
('vp-p-17-s', 'p-17', 'S', 1), ('vp-p-17-a', 'p-17', 'A', 2), ('vp-p-17-t', 'p-17', 'T', 3), ('vp-p-17-b', 'p-17', 'B', 4),
('vp-p-18-s', 'p-18', 'S', 1), ('vp-p-18-a', 'p-18', 'A', 2), ('vp-p-18-t', 'p-18', 'T', 3), ('vp-p-18-b', 'p-18', 'B', 4),
('vp-p-19-s', 'p-19', 'S', 1), ('vp-p-19-a', 'p-19', 'A', 2), ('vp-p-19-t', 'p-19', 'T', 3), ('vp-p-19-b', 'p-19', 'B', 4),
('vp-p-20-s', 'p-20', 'S', 1), ('vp-p-20-a', 'p-20', 'A', 2), ('vp-p-20-t', 'p-20', 'T', 3), ('vp-p-20-b', 'p-20', 'B', 4);

-- =============================================================================
-- 4. p-05 scope-fix: per_voice → whole_piece for t-pv10
-- =============================================================================

DELETE FROM review_entries WHERE param_id = 'p-05-t-pv10' AND review_id = '6354b945-fd26-40ae-934e-51d2051aa6a3';
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks)
VALUES ('re-p05-wp-pv10', '6354b945-fd26-40ae-934e-51d2051aa6a3', 'p-05-t-pv10', NULL, 'õige', NULL);

-- =============================================================================
-- 5. Review entries import from Excel (7 pieces, N/A entries skipped)
-- =============================================================================

DELETE FROM review_entries WHERE review_id = 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a';
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES
('re-p-01-t-pv01-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv01', 'vp-p-01-s', 'viga', 'Viga: takt 10, õige on pidena üks pikk noodikõrgus mõlemas sopranis (hetkel on noodis kopeeritud 8.takti partii)'),
('re-p-01-t-pv01-a', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv01', 'vp-p-01-a', 'viga', 'Viga: takt 9, õige on pidena üks pikk noodikõrgus mõlemas aldis (hetkel on noodis kopeeritud 7.takti partii)'),
('re-p-01-t-pv01-b', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv01', 'vp-p-01-b', 'õige', NULL),
('re-p-01-t-pv02-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv02', 'vp-p-01-s', 'õige', NULL),
('re-p-01-t-pv02-a', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv02', 'vp-p-01-a', 'viga', 'Viga: takt 10, väga nutikas lahendus A noteerimiseks, et ei peaks nii palju kordusi välja kirjutama, aga viga jääb ikkagi sisse, sest aldi pausi 3.voldis ei ole kusagil noodis olemas. Seda saab ainult eeldada, aga seda on liiga palju eeldatu, et see paus siis päriselt ka tekib.'),
('re-p-01-t-pv02-b', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv02', 'vp-p-01-b', 'ettepanek', 'Ettepanek: takt 1, takt 2. Et lihtsustada noodi lugemist ja mitte kasutada üleliigselt sümboleid, siis noteeriksin pausid 3-löögilisena. Kui kasutada vahelduvat taktimõõtu, siis terve takt pausi.'),
('re-p-01-t-pv03-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv03', 'vp-p-01-s', 'viga', 'Viga: takt 10, õige on 3-löögiline noot pidega järgmise noodivältusega kokku.'),
('re-p-01-t-pv03-a', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv03', 'vp-p-01-a', 'viga', 'Viga: takt 9, õige on 3-löögiline noot pidega järgmise noodivältusega kokku.'),
('re-p-01-t-pv03-b', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv03', 'vp-p-01-b', 'viga', 'Viga: takt 7, takt 8. 3. värsireas on 1.löögil õige rütm ti-ri-ti. Originaalnoodis on see märgitud kahe punktiga esimese 8ndiku peal ja võiks olla sama moodi noteeritud ka uues noodis.
Takt 14. Lugu lõppeb 8ndik pausiga. Viimases sõnas "vä-he-nes-sa" on kõik silbid rütmiliselt ühepikkused. (Hetkel on kirjas sama rütm, mis on läbivalt kogu loos)'),
('re-p-01-t-pv04-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv04', 'vp-p-01-s', 'õige', NULL),
('re-p-01-t-pv04-a', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv04', 'vp-p-01-a', 'õige', NULL),
('re-p-01-t-pv04-b', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv04', 'vp-p-01-b', 'viga', 'Viga: takt 3. Õige on esimene sõna väikese algustähega "pisut" (hetkel on suure algustähega).'),
('re-p-01-t-pv06-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv06', 'vp-p-01-s', 'viga', 'Viga: 5.takt, pidekaar takti algusest puudu (noot jääb 1.-2. voldist pidesse)'),
('re-p-01-t-pv06-a', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv06', 'vp-p-01-a', 'õige', NULL),
('re-p-01-t-pv06-b', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv06', 'vp-p-01-b', 'viga', 'Viga: takt 6, 1.-2. voldi pidekaar on puudu. Tuleb kasutada erinevaid volte, et saaks 1.-2.voldi pidekaared noteerida ja 3.volti pidekaart mitte noteerida.'),
('re-p-01-t-pv07-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv07', 'vp-p-01-s', 'ettepanek', 'Ettepanek: takt 8, kui 4.volt eraldi välja kirjutada, siis peab legatokaar ka sellesse takti ulatuma.
Takt 10. Kui rütm on õige, siis selles taktis legatokaart ei ole.'),
('re-p-01-t-pv07-a', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv07', 'vp-p-01-a', 'ettepanek', 'Ettepanek: takt 9. Kui rütm on õige, siis seles taktis legatokaart ei ole.'),
('re-p-01-t-pv09-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv09', 'vp-p-01-s', 'õige', 'Olemas, vead noodikõrgustes ja rütmides'),
('re-p-01-t-pv09-a', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv09', 'vp-p-01-a', 'õige', 'olemas, vead noodikõrgustes ja rütmides'),
('re-p-01-t-pv09-b', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv09', 'vp-p-01-b', 'õige', 'õige, olemas
takt 1, div märge on vajalik, et ei hakataks laulma eeslaulja ja koorina (soolo + koor). Div märge annab märku, et on häälerühma jagunemine, mitte solist ja koor.'),
('re-p-01-t-pv15-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv15', 'vp-p-01-s', 'õige', 'õige, olemas'),
('re-p-01-t-pv15-a', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv15', 'vp-p-01-a', 'viga', 'Viga: takt 6, kuna korduses on 3.lõpp puudu, siis on puudu ka sub f
Takt 8, kuna korduses on 4.lõpp puudu, siis on puudu ka p'),
('re-p-01-t-pv15-b', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv15', 'vp-p-01-b', 'viga', 'Viga: takt 7, sub f  on puudu.
Takt 9, p on puudu'),
('re-p-01-t-pv16-s', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv16', 'vp-p-01-s', 'õige', 'õige, olemas'),
('re-p-01-t-pv16-b', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv16', 'vp-p-01-b', 'viga', 'Viga: takt 8 "(kajaefekt)" on puudu'),
('re-p-01-t-wp01', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-wp01', NULL, 'õige', 'õige, olemas'),
('re-p-01-t-wp02', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-wp02', NULL, 'õige', 'õige, olemas'),
('re-p-01-t-wp03', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-wp03', NULL, 'õige', 'õige, olemas'),
('re-p-01-t-wp08', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-wp08', NULL, 'õige', NULL),
('re-p-01-t-wp09', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-wp09', NULL, 'ettepanek', 'Väga hea lahendus! Lihtsam lugeda, kui originaali.
Ettepanek: Tundub, et taktimõõtude vaheldumine on valitud seetõttu, et saaks lühemalt erinevaid korduse volte kirja panna. Kui neid aga mitte kirja panna, siis läheks saatehäälte dünaamikate kirjapanemine liiga keeruliseks ja arusaamatuks. Niisamuti meloodiahäälte pidekaarte noteerimine. Tekivad vead. Võibolla peaks siiski jääma esialgse vahelduva taktimõõdu juurde, sest 9/8 on loogilisem lugeda noodikõrguseid, aga kui dünaamikaid ja pidekaari on vaja lugeda, siis seda on lihtsam teha vahelduva taktimõõduga notatsioonis.'),
('re-p-01-t-wp10', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'pp-p-01-t-wp10', NULL, 'õige', NULL),
('re-p-01-t-pv10', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv10', NULL, 'õige', 'õige, noot hästi loetav'),
('re-p-01-t-pv11', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv11', NULL, 'ettepanek', 'õiged, olemas'),
('re-p-01-t-pv12', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-pv12', NULL, 'ettepanek', 'Ettepanek: vajalik on erinevate voltide välja-noteerimine, sest muidu ei saa pidekaari ja dünaamikaid kirja panna.'),
('re-p-01-t-wp04', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-wp04', NULL, 'õige', NULL),
('re-p-01-t-wp06', 'eb09a23f-9408-476c-a8d7-3d5a3c02db0a', 'p-01-t-wp06', NULL, 'ettepanek', 'Bassi divisi taktis 1 on olemas.');

DELETE FROM review_entries WHERE review_id = 'rev-p-07-mihkel';
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES
('re-p-07-t-pv01-s', 'rev-p-07-mihkel', 'p-07-t-pv01', 'vp-p-07-s', 'õige', NULL),
('re-p-07-t-pv01-a', 'rev-p-07-mihkel', 'p-07-t-pv01', 'vp-p-07-a', 'ettepanek', 'Ettepanek: takt 8 ja 15, fis-i diees puudu. See on hea meeldetuletus võtmemärgist ja lihtsustab oluliselt noodi lugemist ja harmoonia tajumist.'),
('re-p-07-t-pv01-t', 'rev-p-07-mihkel', 'p-07-t-pv01', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv01-b', 'rev-p-07-mihkel', 'p-07-t-pv01', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv02-s', 'rev-p-07-mihkel', 'p-07-t-pv02', 'vp-p-07-s', 'õige', NULL),
('re-p-07-t-pv02-a', 'rev-p-07-mihkel', 'p-07-t-pv02', 'vp-p-07-a', 'õige', NULL),
('re-p-07-t-pv02-t', 'rev-p-07-mihkel', 'p-07-t-pv02', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv02-b', 'rev-p-07-mihkel', 'p-07-t-pv02', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv03-s', 'rev-p-07-mihkel', 'p-07-t-pv03', 'vp-p-07-s', 'õige', NULL),
('re-p-07-t-pv03-a', 'rev-p-07-mihkel', 'p-07-t-pv03', 'vp-p-07-a', 'õige', NULL),
('re-p-07-t-pv03-t', 'rev-p-07-mihkel', 'p-07-t-pv03', 'vp-p-07-t', 'ettepanek', 'Ettepanek: Takt 5 ja 13, rütmi-punktid on halvasti loetavad. Parem asukoht oleks rütmi kohal (nagu naishäältes), hetkel jäävad liiga joone peale ja märkamatuks, ebaloogiline koht, kus neid lugeda.'),
('re-p-07-t-pv03-b', 'rev-p-07-mihkel', 'p-07-t-pv03', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv04-s', 'rev-p-07-mihkel', 'p-07-t-pv04', 'vp-p-07-s', 'viga', 'Vead: takt 15 S ja A tekst sõna "mil-lal" on kirjas suure algustähega, võiks olla väikese algustähega. (Sama loogika, nagu taktis 7) 
Taktid 13-16 naishäälte tekst visuaalselt madalamal, kui T oma. Võiks olla ühel kõrgusel, nagu taktides 5-8.'),
('re-p-07-t-pv04-a', 'rev-p-07-mihkel', 'p-07-t-pv04', 'vp-p-07-a', 'ettepanek', 'Sopraniga sama tekst, samad ettepanekud.'),
('re-p-07-t-pv04-t', 'rev-p-07-mihkel', 'p-07-t-pv04', 'vp-p-07-t', 'viga', 'Vead: takt 13 sõnas "mei-e" silbituskriips puudu. Igas salmis on samas kohas silbituskriips sõnades puudu.
Takt 13 "kus aga" sõnade vahe liiga väike, teksti halb lugeda.'),
('re-p-07-t-pv04-b', 'rev-p-07-mihkel', 'p-07-t-pv04', 'vp-p-07-b', 'viga', 'vead: takt 3 vale tekst, õige on 2x järjest “tim-pa, tim-pa”. Sama on takt 7, takt 11, takt 15.'),
('re-p-07-t-pv05-a', 'rev-p-07-mihkel', 'p-07-t-pv05', 'vp-p-07-a', 'ettepanek', 'Takt 6 ja 14. Legato on kirjas S+A rea kohal ja ei ole vajadust seda aldi hääles dubleerida (nagu fermaat loo viimases taktis)'),
('re-p-07-t-pv05-t', 'rev-p-07-mihkel', 'p-07-t-pv05', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv05-b', 'rev-p-07-mihkel', 'p-07-t-pv05', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv06-s', 'rev-p-07-mihkel', 'p-07-t-pv06', 'vp-p-07-s', 'õige', NULL),
('re-p-07-t-pv06-a', 'rev-p-07-mihkel', 'p-07-t-pv06', 'vp-p-07-a', 'õige', NULL),
('re-p-07-t-pv06-t', 'rev-p-07-mihkel', 'p-07-t-pv06', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv06-b', 'rev-p-07-mihkel', 'p-07-t-pv06', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv07-t', 'rev-p-07-mihkel', 'p-07-t-pv07', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv08-s', 'rev-p-07-mihkel', 'p-07-t-pv08', 'vp-p-07-s', 'õige', NULL),
('re-p-07-t-pv08-a', 'rev-p-07-mihkel', 'p-07-t-pv08', 'vp-p-07-a', 'ettepanek', 'on loetav ja arusaadav'),
('re-p-07-t-pv08-t', 'rev-p-07-mihkel', 'p-07-t-pv08', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv08-b', 'rev-p-07-mihkel', 'p-07-t-pv08', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv10-s', 'rev-p-07-mihkel', 'p-07-t-pv10', 'vp-p-07-s', 'ettepanek', 'paigutus on hea ja noot seega hästi loetav.'),
('re-p-07-t-pv10-a', 'rev-p-07-mihkel', 'p-07-t-pv10', 'vp-p-07-a', 'ettepanek', 'paigutus on hea ja noot seega hästi loetav.'),
('re-p-07-t-pv10-t', 'rev-p-07-mihkel', 'p-07-t-pv10', 'vp-p-07-t', 'ettepanek', 'Ettepanek on kirjas B lahtris'),
('re-p-07-t-pv10-b', 'rev-p-07-mihkel', 'p-07-t-pv10', 'vp-p-07-b', 'ettepanek', 'ettepanek: A-osas on väga hea, et T ja B on noteeritud eraldi reale (erinevad rollid, erinevad rütmid, erinev tekst, erinevad dünaamikad). B-osas on neil sarnane roll, rütm ja sõnad on samad – siin noteeriksin T+B ühele reale. Annab paremini ülevaate ka tekkivatest harmooniatest (kus on T+B unisonis, millised intervallid häälte vahel tekivad).'),
('re-p-07-t-pv11-s', 'rev-p-07-mihkel', 'p-07-t-pv11', 'vp-p-07-s', 'ettepanek', 'Ettepanek: Häälerühma tähis süsteemi ees on arusaamatu ("W"). Võiks kasutada üldtuntud tähiseid, nagu S ja A.'),
('re-p-07-t-pv11-a', 'rev-p-07-mihkel', 'p-07-t-pv11', 'vp-p-07-a', 'ettepanek', 'Ettepanek on kirjas S lahtris'),
('re-p-07-t-pv12-s', 'rev-p-07-mihkel', 'p-07-t-pv12', 'vp-p-07-s', 'õige', NULL),
('re-p-07-t-pv12-a', 'rev-p-07-mihkel', 'p-07-t-pv12', 'vp-p-07-a', 'õige', NULL),
('re-p-07-t-pv12-t', 'rev-p-07-mihkel', 'p-07-t-pv12', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv12-b', 'rev-p-07-mihkel', 'p-07-t-pv12', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv14-s', 'rev-p-07-mihkel', 'p-07-t-pv14', 'vp-p-07-s', 'õige', NULL),
('re-p-07-t-pv14-a', 'rev-p-07-mihkel', 'p-07-t-pv14', 'vp-p-07-a', 'õige', NULL),
('re-p-07-t-pv14-t', 'rev-p-07-mihkel', 'p-07-t-pv14', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv14-b', 'rev-p-07-mihkel', 'p-07-t-pv14', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv15-s', 'rev-p-07-mihkel', 'p-07-t-pv15', 'vp-p-07-s', 'õige', NULL),
('re-p-07-t-pv15-a', 'rev-p-07-mihkel', 'p-07-t-pv15', 'vp-p-07-a', 'ettepanek', 'Takt 6 ja 14. Forte on kirjas S+A rea kohal ja ei ole vajadust seda aldi hääles dubleerida. (nagu forte tähis taktides 21 ja 25)'),
('re-p-07-t-pv15-t', 'rev-p-07-mihkel', 'p-07-t-pv15', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv15-b', 'rev-p-07-mihkel', 'p-07-t-pv15', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-pv16-t', 'rev-p-07-mihkel', 'p-07-t-pv16', 'vp-p-07-t', 'õige', NULL),
('re-p-07-t-pv16-b', 'rev-p-07-mihkel', 'p-07-t-pv16', 'vp-p-07-b', 'õige', NULL),
('re-p-07-t-wp01', 'rev-p-07-mihkel', 'p-07-t-wp01', NULL, 'õige', NULL),
('re-p-07-t-wp02', 'rev-p-07-mihkel', 'p-07-t-wp02', NULL, 'ettepanek', 'Puudu. Originaalnoodis ka ei ole, aga kuna tegemist on eraldi noodiga, mitte terve kogumikuga, siis võiks olla kirjas ka helilooja nimi'),
('re-p-07-t-wp03', 'rev-p-07-mihkel', 'p-07-t-wp03', NULL, 'õige', 'olemas (Tõstamaa)'),
('re-p-07-t-wp04', 'rev-p-07-mihkel', 'p-07-t-wp04', NULL, 'õige', NULL),
('re-p-07-t-wp05', 'rev-p-07-mihkel', 'p-07-t-wp05', NULL, 'õige', NULL);

DELETE FROM review_entries WHERE review_id = 'rev-p-08-liisa';
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES
('re-p-08-t-pv01-s', 'rev-p-08-liisa', 'p-08-t-pv01', 'vp-p-08-s', 'viga', 'Viga: takt 13, 1.löögi viimane 16-ndik on hetkel si-noot. Õige on  do-noot (c2).'),
('re-p-08-t-pv01-a', 'rev-p-08-liisa', 'p-08-t-pv01', 'vp-p-08-a', 'õige', NULL),
('re-p-08-t-pv01-t', 'rev-p-08-liisa', 'p-08-t-pv01', 'vp-p-08-t', 'õige', NULL),
('re-p-08-t-pv01-b', 'rev-p-08-liisa', 'p-08-t-pv01', 'vp-p-08-b', 'õige', NULL),
('re-p-08-t-pv02-s', 'rev-p-08-liisa', 'p-08-t-pv02', 'vp-p-08-s', 'õige', NULL),
('re-p-08-t-pv02-a', 'rev-p-08-liisa', 'p-08-t-pv02', 'vp-p-08-a', 'õige', NULL),
('re-p-08-t-pv02-t', 'rev-p-08-liisa', 'p-08-t-pv02', 'vp-p-08-t', 'õige', NULL),
('re-p-08-t-pv02-b', 'rev-p-08-liisa', 'p-08-t-pv02', 'vp-p-08-b', 'õige', NULL),
('re-p-08-t-pv03-s', 'rev-p-08-liisa', 'p-08-t-pv03', 'vp-p-08-s', 'õige', NULL),
('re-p-08-t-pv03-a', 'rev-p-08-liisa', 'p-08-t-pv03', 'vp-p-08-a', 'õige', NULL),
('re-p-08-t-pv03-t', 'rev-p-08-liisa', 'p-08-t-pv03', 'vp-p-08-t', 'õige', NULL),
('re-p-08-t-pv03-b', 'rev-p-08-liisa', 'p-08-t-pv03', 'vp-p-08-b', 'õige', NULL),
('re-p-08-t-pv04-s', 'rev-p-08-liisa', 'p-08-t-pv04', 'vp-p-08-s', 'ettepanek', 'Ettepanek: takt 39, kõikidel häälerühmadel suurem vahe sõnade "oleme" ja "hoolsad" vahele. Hetkel liiga koos ja raske lugeda. Sõnas "hoolsad" -sad silp silbituskriipsust veidi eemale nihutada. Hetkel on silp kriipsuga liiga koos ja raske lugeda. 
Takti 43-44 on samuti sõnad liiga koos, aga siin ei saa teisiti teha, sest muidu läheb noot pikemaks. Praegune süsteemide asetus on hea. 
Takt 71-81, kõikides häälerühmades sõnade "maha" ja "siis" vahele suurem vahe. Hetkel liiga koos ja raske lugeda. 
Viga: takt 45, kõikidel häälerühmadel esimese sõna "kavalad" viimases silbis on a-täht puudu. 
TAkt 75, kõikides häälerühmades sõna "maha" suure algustähega. Õige on väikese algustähega. 

Takt 10, takt 14, hüüumärk puudu (hetkel on koma). 
TAkt 47, väike algustäht. Õige on suur algustäht.
Takt 50, vale sõna. Õige on "meie".
Takt 79, suur algustäht. Õige on väikese algustähega.'),
('re-p-08-t-pv04-a', 'rev-p-08-liisa', 'p-08-t-pv04', 'vp-p-08-a', 'viga', 'Viga: takt 47, väike algustäht. Õige on suur algustäht. 
Takt 50 vale sõna. Õige on "meie".
Takt 80, suur algustäht. Õige on väikese algustähega.'),
('re-p-08-t-pv04-t', 'rev-p-08-liisa', 'p-08-t-pv04', 'vp-p-08-t', 'viga', 'Viga: takt 5, takt 9, sõna "söö-ge" on suure algustähega. Õige on väikese algustähega. 
Takt 12, hüüumärk puudu. Praegu on kirjas koma, õige on selle asemel hüüumärk.
Takt 62, viimase sõna järel on koma puudu.
Takt 47, sõna järelt on koma puudu.
Takt 48, vale sõna. Õige on "mei-e".
Takt 62, takti lõpust koma puudu. 


Takt 31-32, hüüumärk ja suur algustäht on õige parandus võrreldes originaaliga. 
Takt 58, takti lõpus koma on õige.'),
('re-p-08-t-pv04-b', 'rev-p-08-liisa', 'p-08-t-pv04', 'vp-p-08-b', 'viga', 'Viga: takt 5, takt 9, sõna "söö-ge" on suure algustähega. Õige on väikese algustähega. 
Takt 12, hüüumärk puudu. Praegu on kirjas koma, õige on selle asemel hüüumärk.
Takt 62, viimase sõna järel on koma puudu.'),
('re-p-08-t-pv05-s', 'rev-p-08-liisa', 'p-08-t-pv05', 'vp-p-08-s', 'viga', 'Viga: takt 85-86, kõikides häälerühmades rõhkude asukoht silbil "sai-" on vales kohas (taktis 85). Õige on rõhk takti 86 esimesel 8-ndikul.'),
('re-p-08-t-pv05-a', 'rev-p-08-liisa', 'p-08-t-pv05', 'vp-p-08-a', 'viga', 'Viga on kirjas S lahtris.'),
('re-p-08-t-pv05-t', 'rev-p-08-liisa', 'p-08-t-pv05', 'vp-p-08-t', 'viga', 'Viga on kirjas S lahtris.'),
('re-p-08-t-pv05-b', 'rev-p-08-liisa', 'p-08-t-pv05', 'vp-p-08-b', 'viga', 'Viga on kirjas S lahtris.'),
('re-p-08-t-pv06-s', 'rev-p-08-liisa', 'p-08-t-pv06', 'vp-p-08-s', 'viga', 'Viga: Takt 21, pidekaar sõnal "ärge". Õige on ilma pidekaareta.'),
('re-p-08-t-pv06-a', 'rev-p-08-liisa', 'p-08-t-pv06', 'vp-p-08-a', 'õige', NULL),
('re-p-08-t-pv06-t', 'rev-p-08-liisa', 'p-08-t-pv06', 'vp-p-08-t', 'viga', 'Viga: Takt 21, pidekaar sõnal "ärge". Õige on ilma pidekaareta.'),
('re-p-08-t-pv06-b', 'rev-p-08-liisa', 'p-08-t-pv06', 'vp-p-08-b', 'õige', NULL),
('re-p-08-t-pv07-s', 'rev-p-08-liisa', 'p-08-t-pv07', 'vp-p-08-s', 'õige', NULL),
('re-p-08-t-pv07-a', 'rev-p-08-liisa', 'p-08-t-pv07', 'vp-p-08-a', 'ettepanek', 'Takt 66, väga hea tähelepanek, et originaalis oli siin legatokaar puudu. :)'),
('re-p-08-t-pv07-t', 'rev-p-08-liisa', 'p-08-t-pv07', 'vp-p-08-t', 'õige', NULL),
('re-p-08-t-pv07-b', 'rev-p-08-liisa', 'p-08-t-pv07', 'vp-p-08-b', 'õige', NULL),
('re-p-08-t-pv08-s', 'rev-p-08-liisa', 'p-08-t-pv08', 'vp-p-08-s', 'viga', 'Vead: Takt 38, takt 42, kõikides häälerühmades fermaat ei ole kohakuti hingamiskomaga. Õige on see, kui koma on visuaalselt täpselt fermaadi all.
Takt 70, fermaatide alt hingamiskoma puudu'),
('re-p-08-t-pv08-a', 'rev-p-08-liisa', 'p-08-t-pv08', 'vp-p-08-a', 'viga', 'Viga on kirjas S lahtris.'),
('re-p-08-t-pv08-t', 'rev-p-08-liisa', 'p-08-t-pv08', 'vp-p-08-t', 'viga', 'Viga on kirjas S lahtris.'),
('re-p-08-t-pv08-b', 'rev-p-08-liisa', 'p-08-t-pv08', 'vp-p-08-b', 'viga', 'Viga on kirjas S lahtris.'),
('re-p-08-t-pv09-t', 'rev-p-08-liisa', 'p-08-t-pv09', 'vp-p-08-t', 'õige', NULL),
('re-p-08-t-pv15-s', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-s', 'õige', NULL),
('re-p-08-t-pv15-a', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-a', 'viga', 'Viga: takt 21, forte tähis puudu.'),
('re-p-08-t-pv15-t', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-t', 'õige', NULL),
('re-p-08-t-pv15-b', 'rev-p-08-liisa', 'p-08-t-pv15', 'vp-p-08-b', 'õige', NULL),
('re-p-08-t-pv16-s', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-s', 'õige', NULL),
('re-p-08-t-pv16-a', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-a', 'õige', NULL),
('re-p-08-t-pv16-t', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-t', 'õige', NULL),
('re-p-08-t-pv16-b', 'rev-p-08-liisa', 'p-08-t-pv16', 'vp-p-08-b', 'õige', NULL),
('re-p-08-t-pv17-a', 'rev-p-08-liisa', 'p-08-t-pv17', 'vp-p-08-a', 'viga', 'Viga: takt 55, takt 63, takt 75, noole asukoht ja asend vale. Õige on see, kui nool paikneb noodipeast all pool, diagonaalis nii et noodi pea juhib tähelepanu aldi partiile. Sellega antakse märku, et meloodialiin liigub selle koha peal mööda aldipartiid.'),
('re-p-08-t-pv17-b', 'rev-p-08-liisa', 'p-08-t-pv17', 'vp-p-08-b', 'viga', 'Viga: takt 59, noole asukoht ja asend vale. Õige on see, kui nool paikneb noodipeast all pool, diagonaalis nii et noodi pea juhib tähelepanu bassi partiile. Sellega antakse märku, et meloodialiin liigub selle koha peal mööda bassipartiid.'),
('re-p-08-t-wp01', 'rev-p-08-liisa', 'p-08-t-wp01', NULL, 'õige', NULL),
('re-p-08-t-wp02', 'rev-p-08-liisa', 'p-08-t-wp02', NULL, 'õige', 'õige 
Soovi korral võib lisada ka helilooja sünni-surmadaatumid, aga ei pea'),
('re-p-08-t-wp03', 'rev-p-08-liisa', 'p-08-t-wp03', NULL, 'ettepanek', 'Ettepanek: kirjutaksin pealkirja alla sulgudesse "Kihnu", sest see on kogumikust välja võetu noot ja nii ei ole teada, et tegemist on "Kihnu" loo ja tekstiga. Selliselt on "tekstiautor" ka kirjas.'),
('re-p-08-t-wp08', 'rev-p-08-liisa', 'p-08-t-wp08', NULL, 'õige', NULL),
('re-p-08-t-wp09', 'rev-p-08-liisa', 'p-08-t-wp09', NULL, 'õige', NULL),
('re-p-08-t-pv10', 'rev-p-08-liisa', 'p-08-t-pv10', NULL, 'ettepanek', 'Korras. Noot on loogiliselt jälgitav ja loetav.'),
('re-p-08-t-pv11', 'rev-p-08-liisa', 'p-08-t-pv11', NULL, 'õige', 'olemas, õiged
Soovi korral võib ka aldi esimese süsteemi ees kirjutada eesti keeles, aga ei pea.'),
('re-p-08-t-wp04', 'rev-p-08-liisa', 'p-08-t-wp04', NULL, 'õige', NULL),
('re-p-08-t-wp05', 'rev-p-08-liisa', 'p-08-t-wp05', NULL, 'viga', 'Viga: takt 63. Puudu on tempotähis (sõnadega): poco a poco accelerando.
Takt 73. Tempo kirjeldus on vale takti kohal. Õige on poco a poco accelerando al fine takti 73 kohal (hetkel on takti 71 kohal, mis tekitab kiirenduse takt varem)'),
('re-p-08-t-pv14', 'rev-p-08-liisa', 'p-08-t-pv14', NULL, 'viga', 'Viga:  kasti sees olevad numbrid on segadust tekitavad. Tavaliselt on nendes kastides kirjas taktinumbrid. Praegu noodis olevad numbrid ei vasta taktinumbritele, see tekitab partii õppimisel segadust ja ei aita ka vormiliselt nooti lugeda. Originaalnoodis sedalaadi vormitähised puuduvad ja mina võtaksin need ka uuesti trükitud noodist ära.'),
('re-p-08-t-wp07', 'rev-p-08-liisa', 'p-08-t-wp07', NULL, 'ettepanek', 'Ettepanek: Viimane takt, kirjas on loo valmimisaasta, aga see info võiks olla viimase süsteemi all. Hetkel mõjub see nagu B häälerühmale mõeldud juhis. Puudu on teine aastaarv, õige on "1959/1994"');

DELETE FROM review_entries WHERE review_id = '8b4072ea-99d7-40e7-b540-51509db8aa82';
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES
('re-p-09-t-pv01-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv01', 'vp-p-09-s', 'õige', NULL),
('re-p-09-t-pv01-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv01', 'vp-p-09-a', 'õige', NULL),
('re-p-09-t-pv01-t', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv01', 'vp-p-09-t', 'õige', NULL),
('re-p-09-t-pv01-b', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv01', 'vp-p-09-b', 'õige', NULL),
('re-p-09-t-pv02-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv02', 'vp-p-09-s', 'ettepanek', 'Ettepanek: alates takt 3, kui on tarve takt pausi, siis märgiksin ühe sümbiliga (nagu originaalnoodis), nii on vähem erinevaid märke, mida silm haarama peab'),
('re-p-09-t-pv02-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv02', 'vp-p-09-a', 'ettepanek', 'Ettepanek: alates takt 1, kui on tarve takt pausi, siis märgiksin ühe sümbiliga (nagu originaalnoodis), nii on vähem erinevaid märke, mida silm haarama peab'),
('re-p-09-t-pv03-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv03', 'vp-p-09-s', 'õige', NULL),
('re-p-09-t-pv03-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv03', 'vp-p-09-a', 'õige', NULL),
('re-p-09-t-pv03-t', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv03', 'vp-p-09-t', 'õige', NULL),
('re-p-09-t-pv03-b', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv03', 'vp-p-09-b', 'õige', NULL),
('re-p-09-t-pv04-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv04', 'vp-p-09-s', 'viga', 'Viga: takt 5, 2. salm algab väikese algustähega (hetkel on suurega, õige on "ära")'),
('re-p-09-t-pv04-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv04', 'vp-p-09-a', 'viga', 'Viga: takt 7, 4. salm algab suure algustähega (hetkel on väikesega, õige on "Lubasid")'),
('re-p-09-t-pv04-t', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv04', 'vp-p-09-t', 'õige', NULL),
('re-p-09-t-pv04-b', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv04', 'vp-p-09-b', 'õige', NULL),
('re-p-09-t-pv05-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv05', 'vp-p-09-s', 'õige', 'õige, olemas'),
('re-p-09-t-pv05-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv05', 'vp-p-09-a', 'õige', 'õige, olemas'),
('re-p-09-t-pv05-t', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv05', 'vp-p-09-t', 'õige', 'õige, olemas'),
('re-p-09-t-pv05-b', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv05', 'vp-p-09-b', 'õige', 'õige, olemas'),
('re-p-09-t-pv06-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv06', 'vp-p-09-s', 'õige', 'õige, olemas'),
('re-p-09-t-pv06-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv06', 'vp-p-09-a', 'õige', 'õige, olemas'),
('re-p-09-t-pv06-t', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv06', 'vp-p-09-t', 'õige', 'õige, olemas'),
('re-p-09-t-pv06-b', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv06', 'vp-p-09-b', 'õige', 'õige, olemas'),
('re-p-09-t-pv07-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv07', 'vp-p-09-s', 'õige', 'õige, olemas'),
('re-p-09-t-pv07-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv07', 'vp-p-09-a', 'õige', 'õige, olemas'),
('re-p-09-t-pv07-t', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv07', 'vp-p-09-t', 'õige', 'õige, olemas'),
('re-p-09-t-pv07-b', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv07', 'vp-p-09-b', 'õige', 'õige, olemas'),
('re-p-09-t-pv15-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv15', 'vp-p-09-s', 'viga', 'Viga: takt 1, mf puudu.'),
('re-p-09-t-pv15-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv15', 'vp-p-09-a', 'viga', 'Viga: takt 2, mf puudu.'),
('re-p-09-t-pv15-t', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv15', 'vp-p-09-t', 'viga', 'Viga: T+B, takt 4, mf puudu.'),
('re-p-09-t-pv15-b', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv15', 'vp-p-09-b', 'viga', 'Viga kirjas T lahtris'),
('re-p-09-t-pv17-s', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv17', 'vp-p-09-s', 'ettepanek', 'Takt 11, unisoni märge on siin hea valik'),
('re-p-09-t-pv17-a', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv17', 'vp-p-09-a', 'ettepanek', 'sama, mis S'),
('re-p-09-t-pv17-t', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv17', 'vp-p-09-t', 'õige', NULL),
('re-p-09-t-pv17-b', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv17', 'vp-p-09-b', 'õige', NULL),
('re-p-09-t-wp01', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-wp01', NULL, 'õige', 'õige, olemas'),
('re-p-09-t-wp02', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-wp02', NULL, 'ettepanek', 'Ettepanek:  helilooja nimi on puudu. Mina lisaksin, sest tegemist on üksiku noodiga, mitte kogumikuga. Kui keegi ainult seda nooti kasutab, siis ta ei tea, kes autor on.'),
('re-p-09-t-wp03', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-wp03', NULL, 'õige', 'olemas, teksti päritolu pealkirja all.'),
('re-p-09-t-wp08', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-wp08', NULL, 'õige', NULL),
('re-p-09-t-wp09', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-wp09', NULL, 'õige', NULL),
('re-p-09-t-pv10', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv10', NULL, 'õige', 'õige, nooti on hea lugeda'),
('re-p-09-t-pv11', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv11', NULL, 'õige', 'õige, olemas'),
('re-p-09-t-pv12', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-pv12', NULL, 'õige', 'õige, olemas'),
('re-p-09-t-wp04', '8b4072ea-99d7-40e7-b540-51509db8aa82', 'p-09-t-wp04', NULL, 'õige', 'õige, olemas');

DELETE FROM review_entries WHERE review_id = 'f7859b2b-eac3-46ba-a768-35b8c4424fc8';
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES
('re-p-10-t-pv01-s', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv01', 'vp-p-10-s', 'õige', NULL),
('re-p-10-t-pv01-a', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv01', 'vp-p-10-a', 'õige', NULL),
('re-p-10-t-pv01-t', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv01', 'vp-p-10-t', 'õige', NULL),
('re-p-10-t-pv01-b', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv01', 'vp-p-10-b', 'õige', NULL),
('re-p-10-t-pv02-s', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv02', 'vp-p-10-s', 'õige', NULL),
('re-p-10-t-pv02-a', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv02', 'vp-p-10-a', 'õige', NULL),
('re-p-10-t-pv02-t', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv02', 'vp-p-10-t', 'õige', NULL),
('re-p-10-t-pv02-b', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv02', 'vp-p-10-b', 'õige', NULL),
('re-p-10-t-pv03-s', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv03', 'vp-p-10-s', 'õige', NULL),
('re-p-10-t-pv03-a', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv03', 'vp-p-10-a', 'õige', NULL),
('re-p-10-t-pv03-t', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv03', 'vp-p-10-t', 'õige', NULL),
('re-p-10-t-pv03-b', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv03', 'vp-p-10-b', 'õige', NULL),
('re-p-10-t-pv04-s', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv04', 'vp-p-10-s', 'viga', 'Viga: takt 5, esimene sõna on vale, õige on "kirs-tu" (hetkel on kirjas "karstu") 
Ettepanek: takt 11, originaali järgi on siin punkt, aga peale värsirida tule veel "kaas´ke" ja mina paneksin siia värsirea järele koma (selle sama kaas´ke pärast). Teine variant on viimane "kaas´ke" suure algustähega kirjutada, aga see tundub terviku mõttes veel ebalooglisem, sest kõik muud "kaas´ked" on väikese algustähega ja komaga. Läbivalt väikese algustähega on ka A ja meeshäälte "kaas´ke".'),
('re-p-10-t-pv04-a', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv04', 'vp-p-10-a', 'õige', NULL),
('re-p-10-t-pv04-t', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv04', 'vp-p-10-t', 'õige', NULL),
('re-p-10-t-pv04-b', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv04', 'vp-p-10-b', 'õige', NULL),
('re-p-10-t-pv06-s', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv06', 'vp-p-10-s', 'õige', 'õige, olemas'),
('re-p-10-t-pv06-a', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv06', 'vp-p-10-a', 'õige', 'õige, olemas'),
('re-p-10-t-pv06-t', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv06', 'vp-p-10-t', 'õige', 'õige, olemas'),
('re-p-10-t-pv06-b', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv06', 'vp-p-10-b', 'õige', 'õige, olemas'),
('re-p-10-t-pv08-s', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv08', 'vp-p-10-s', 'viga', 'Viga: S+A, takt 16, fermaat puudu.'),
('re-p-10-t-pv08-a', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv08', 'vp-p-10-a', 'viga', 'Viga kirjas S lahtris'),
('re-p-10-t-pv08-t', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv08', 'vp-p-10-t', 'õige', 'õige, olemas'),
('re-p-10-t-pv08-b', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv08', 'vp-p-10-b', 'õige', 'õige, olemas'),
('re-p-10-t-pv09-a', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv09', 'vp-p-10-a', 'õige', 'õige, olemas'),
('re-p-10-t-pv15-s', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv15', 'vp-p-10-s', 'õige', 'õige, olemas'),
('re-p-10-t-pv15-a', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv15', 'vp-p-10-a', 'ettepanek', 'Ettepanek: kui S ja A ühele reale noteerida, siis lisaksin aldi partii algusesse ikkagi p tähise. Originaalise seda ei ole, aga see oleks vajalik.'),
('re-p-10-t-pv15-t', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv15', 'vp-p-10-t', 'õige', 'õige, olemas'),
('re-p-10-t-pv15-b', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv15', 'vp-p-10-b', 'õige', 'õige, olemas'),
('re-p-10-t-wp01', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-wp01', NULL, 'õige', NULL),
('re-p-10-t-wp02', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-wp02', NULL, 'ettepanek', 'Ettepanek: helilooja nimi on puudu. Mina lisaksin, sest tegemist on üksiku noodiga, mitte kogumikuga. Kui keegi ainult seda nooti kasutab, siis ta ei tea, kes autor on.'),
('re-p-10-t-wp03', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-wp03', NULL, 'õige', 'olemas, teksti päritolu pealkirja all.'),
('re-p-10-t-wp08', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-wp08', NULL, 'õige', NULL),
('re-p-10-t-wp09', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-wp09', NULL, 'õige', NULL),
('re-p-10-t-pv10', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv10', NULL, 'ettepanek', 'Ettepanek: S ja A võiksid olla noteeritud ühele reale, sest siis saab nooti ka harmooniliselt lugeda. Hetkel on S raske jälgida seda, et nende ühe ja sama mel alla tekib kaks erinevat harmooniat (kord üks, siis teine).'),
('re-p-10-t-pv12', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-pv12', NULL, 'õige', 'õige, olemas'),
('re-p-10-t-wp04', 'f7859b2b-eac3-46ba-a768-35b8c4424fc8', 'p-10-t-wp04', NULL, 'õige', NULL);

DELETE FROM review_entries WHERE review_id = 'rev-p-11-liisa';
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES
('re-p-11-t-pv01-s', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-s', 'õige', NULL),
('re-p-11-t-pv01-a', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-a', 'õige', NULL),
('re-p-11-t-pv01-t', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-t', 'õige', NULL),
('re-p-11-t-pv01-b', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-b', 'õige', NULL),
('re-p-11-t-pv01-soolo', 'rev-p-11-liisa', 'p-11-t-pv01', 'vp-p-11-soolo', 'õige', NULL),
('re-p-11-t-pv03-s', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-s', 'õige', NULL),
('re-p-11-t-pv03-a', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-a', 'õige', NULL),
('re-p-11-t-pv03-t', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-t', 'õige', NULL),
('re-p-11-t-pv03-b', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-b', 'õige', NULL),
('re-p-11-t-pv03-soolo', 'rev-p-11-liisa', 'p-11-t-pv03', 'vp-p-11-soolo', 'õige', NULL),
('re-p-11-t-pv04-s', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-s', 'ettepanek', 'Ettepanek: takt 13, takt 17, sõnade vahel liiga väike vahe. Raske teksti lugeda.'),
('re-p-11-t-pv04-a', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-a', 'õige', NULL),
('re-p-11-t-pv04-t', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-t', 'õige', NULL),
('re-p-11-t-pv04-b', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-b', 'õige', NULL),
('re-p-11-t-pv04-soolo', 'rev-p-11-liisa', 'p-11-t-pv04', 'vp-p-11-soolo', 'viga', 'Viga:  takt 35 topelt L-häälik. Õige on "kü-la".
Takt 50, takt 54, sõnade vahel liiga väike vahe. Teksti raske lugeda.'),
('re-p-11-t-pv05-s', 'rev-p-11-liisa', 'p-11-t-pv05', 'vp-p-11-s', 'õige', NULL),
('re-p-11-t-pv05-a', 'rev-p-11-liisa', 'p-11-t-pv05', 'vp-p-11-a', 'õige', NULL),
('re-p-11-t-pv05-t', 'rev-p-11-liisa', 'p-11-t-pv05', 'vp-p-11-t', 'õige', NULL),
('re-p-11-t-pv05-b', 'rev-p-11-liisa', 'p-11-t-pv05', 'vp-p-11-b', 'õige', NULL),
('re-p-11-t-pv06-s', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-s', 'viga', 'V: Takt 13, takt 17, pidekaar on üleliigne. Sõnas "kü-la" on 2 silpi, pidekaar annab mõista, et on 1 silp. Mõistan, et punktiirpide eesmärk on edasi anda laulmistunnetust, aga seda õpetab dirigent proovis ja seda noodis dubleerida ei ole vaja. Pidekaared annavad infot rütmi kohta.'),
('re-p-11-t-pv06-a', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-a', 'õige', NULL),
('re-p-11-t-pv06-t', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-t', 'õige', NULL),
('re-p-11-t-pv06-b', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-b', 'õige', NULL),
('re-p-11-t-pv06-soolo', 'rev-p-11-liisa', 'p-11-t-pv06', 'vp-p-11-soolo', 'viga', 'V: takt 33, pidekaar on üleliigne.  Sõnas "jää-gu" on 2 silpi, pidekaar annab mõista, et on 1 silp.'),
('re-p-11-t-pv07-s', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-s', 'õige', NULL),
('re-p-11-t-pv07-a', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-a', 'õige', NULL),
('re-p-11-t-pv07-t', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-t', 'õige', NULL),
('re-p-11-t-pv07-b', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-b', 'õige', NULL),
('re-p-11-t-pv07-soolo', 'rev-p-11-liisa', 'p-11-t-pv07', 'vp-p-11-soolo', 'õige', NULL),
('re-p-11-t-pv15-s', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-s', 'ettepanek', 'Ettepanek:  takt 87, kõikides häältes, cresc kahvel algab originaalnoodis takt 86 lõpust. Kuna uues noodis jääb taktide üleminek reavahetusele, siis ei oleks kahvel üle rea arusaadavalt loetav, aga selles taktis võiks kahvli veel paar millimeetrit takti alguseni välja venitada, et oleks aru saada, et crescendo tekib läbi motiivi, mitte rõhutatult 87. takti esimesest löögist.'),
('re-p-11-t-pv15-a', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-a', 'ettepanek', 'Ettepanek on S lahtris.'),
('re-p-11-t-pv15-t', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-t', 'ettepanek', 'Ettepanek on S lahtris'),
('re-p-11-t-pv15-b', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-b', 'ettepanek', 'Ettepanek on S lahtris'),
('re-p-11-t-pv15-soolo', 'rev-p-11-liisa', 'p-11-t-pv15', 'vp-p-11-soolo', 'õige', NULL),
('re-p-11-t-pv16-s', 'rev-p-11-liisa', 'p-11-t-pv16', 'vp-p-11-s', 'õige', NULL),
('re-p-11-t-pv16-a', 'rev-p-11-liisa', 'p-11-t-pv16', 'vp-p-11-a', 'õige', NULL),
('re-p-11-t-pv16-t', 'rev-p-11-liisa', 'p-11-t-pv16', 'vp-p-11-t', 'õige', NULL),
('re-p-11-t-pv16-b', 'rev-p-11-liisa', 'p-11-t-pv16', 'vp-p-11-b', 'õige', NULL),
('re-p-11-t-wp01', 'rev-p-11-liisa', 'p-11-t-wp01', NULL, 'õige', NULL),
('re-p-11-t-wp02', 'rev-p-11-liisa', 'p-11-t-wp02', NULL, 'õige', 'olemas, õige
Ettepanek: soovi korral võib lisada eludaatumid, aga ei pea'),
('re-p-11-t-wp03', 'rev-p-11-liisa', 'p-11-t-wp03', NULL, 'ettepanek', 'Ettepanek: kirjutaksin pealkirja alla sulgudesse "Kihnu", sest see on kogumikust välja võetu noot ja nii ei ole teada, et tegemist on "Kihnu" loo ja tekstiga. Selliselt on lisaks teksti seadjale kirjas ka teksti originaalpäritolu.'),
('re-p-11-t-wp08', 'rev-p-11-liisa', 'p-11-t-wp08', NULL, 'õige', NULL),
('re-p-11-t-wp09', 'rev-p-11-liisa', 'p-11-t-wp09', NULL, 'õige', NULL),
('re-p-11-t-pv10', 'rev-p-11-liisa', 'p-11-t-pv10', NULL, 'ettepanek', 'Ettepanek: Solisti rida ei ole süsteemide alguses kriipsuga kooriinstrumendi süsteemiga koos, aga peaks olema (nagu originaalnoodis), sest koor ja solist kõlavad siin korraga ja moodustavad kokku ühe süsteemi (nagu orkestripartituuris, kus on erinevad pillid, aga süsteemi alguses on kõik ühe pideva joonega ühendatud). Taktinumbri tähised on küll solisti rea kohal, mis annab märku, et see kõik kõlab korraga, aga silm haarab süsteemi alguses erinevat infot hetkel'),
('re-p-11-t-pv11', 'rev-p-11-liisa', 'p-11-t-pv11', NULL, 'õige', NULL),
('re-p-11-t-wp04', 'rev-p-11-liisa', 'p-11-t-wp04', NULL, 'õige', NULL),
('re-p-11-t-pv14', 'rev-p-11-liisa', 'p-11-t-pv14', NULL, 'ettepanek', 'Taktinumbrid süsteemi keskel on hea lisandus ja hõlbustab noodi lugemist ja loo vormilist tunnetust. Vajalik on aga ühe ja sama süsteemsuse kasutamine terves loos. Lugu on kvadraatse ülesehitusega, mille kõige väiksem tajutav tervik on läbivalt 4-taktiline. Seega  - kas number iga 4 takti järel või siis ainult süsteemide alguses. 

Takt 64, number on üleliigne. Selle koha peal vormiline tunnetus ei muutu, loo aluseks on läbivalt 4-taktiline tervik, lihtsalt mõnes kohas on muusikalise fraasi terviku tunnetus palju pikem ja mõni fraas algab intensiivselt juba eelmise fraasi lõpust. Selle koha peal solist lõpetab oma  viimast 4-st ja koor juba valmistab oma käiguga ette järgmist vormiliselt tajutavat 4-se algust. 

Takt 69, takti number on puudu. 
Takt 89, takti number on puudu. 
Takt 97, takti number on puudu. 
Takt 105, takti number on puudu.');

DELETE FROM review_entries WHERE review_id = 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f';
INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES
('re-p-12-t-pv01-s', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv01', '0cfe14e6-5ac1-4e4e-a7bd-b59ec898d6ba', 'õige', NULL),
('re-p-12-t-pv01-a', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv01', 'aaf99d34-5bcb-4605-bd09-8fd0972a8290', 'õige', NULL),
('re-p-12-t-pv01-t', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv01', '53bf94fb-0028-42b0-a3f4-ceb7fa6e7724', 'õige', NULL),
('re-p-12-t-pv01-b', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv01', '175f7171-bfc1-416e-a65d-600cf9d85eca', 'viga', 'Viga: takt 11-12, seal peab olema ainult e-noot.'),
('re-p-12-t-pv02-s', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv02', '0cfe14e6-5ac1-4e4e-a7bd-b59ec898d6ba', 'õige', 'õige, olemas'),
('re-p-12-t-pv02-a', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv02', 'aaf99d34-5bcb-4605-bd09-8fd0972a8290', 'õige', 'õige, olemas'),
('re-p-12-t-pv02-t', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv02', '53bf94fb-0028-42b0-a3f4-ceb7fa6e7724', 'õige', 'õige, olemas'),
('re-p-12-t-pv02-b', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv02', '175f7171-bfc1-416e-a65d-600cf9d85eca', 'õige', 'õige, olemas'),
('re-p-12-t-pv03-s', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv03', '0cfe14e6-5ac1-4e4e-a7bd-b59ec898d6ba', 'õige', NULL),
('re-p-12-t-pv03-a', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv03', 'aaf99d34-5bcb-4605-bd09-8fd0972a8290', 'õige', NULL),
('re-p-12-t-pv03-t', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv03', '53bf94fb-0028-42b0-a3f4-ceb7fa6e7724', 'õige', NULL),
('re-p-12-t-pv03-b', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv03', '175f7171-bfc1-416e-a65d-600cf9d85eca', 'õige', NULL),
('re-p-12-t-pv04-s', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv04', '0cfe14e6-5ac1-4e4e-a7bd-b59ec898d6ba', 'ettepanek', 'Ettepanek: takt 17, sõnade vahe "augud" ja "suured" vahel võiks olla suurem.'),
('re-p-12-t-pv04-a', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv04', 'aaf99d34-5bcb-4605-bd09-8fd0972a8290', 'ettepanek', 'Ettepanek: Takt 3, 7 ja 19. Mm teksti meeldetuletuse võtaksin ridade algusest ära, sest tarvis on, et lauldes tekiks üks hästi ühtlane pikk liin, aga kui silm näeb uuesti "mm", siis aju paratamatult tahab ka uut teksti öelda. Võib juhtuda, et see innustab lauljaid nende kohtade peal uuesti hingama.'),
('re-p-12-t-pv04-t', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv04', '53bf94fb-0028-42b0-a3f4-ceb7fa6e7724', 'ettepanek', 'Ettepanek: takt 3, õigekirjaliselt oleks vist õige "akame, mehed, minema", nii et sõna mehed on mõlemalt poolt komadega eraldatud. Originaalis seda ei ole, aga ma lisaks siia selle koma.'),
('re-p-12-t-pv04-b', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv04', '175f7171-bfc1-416e-a65d-600cf9d85eca', 'ettepanek', 'Ettepanekud on teistes lahtrites.'),
('re-p-12-t-pv06-s', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv06', '0cfe14e6-5ac1-4e4e-a7bd-b59ec898d6ba', 'õige', NULL),
('re-p-12-t-pv06-a', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv06', 'aaf99d34-5bcb-4605-bd09-8fd0972a8290', 'õige', NULL),
('re-p-12-t-pv06-t', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv06', '53bf94fb-0028-42b0-a3f4-ceb7fa6e7724', 'õige', NULL),
('re-p-12-t-pv06-b', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv06', '175f7171-bfc1-416e-a65d-600cf9d85eca', 'õige', NULL),
('re-p-12-t-pv15-s', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv15', '0cfe14e6-5ac1-4e4e-a7bd-b59ec898d6ba', 'õige', NULL),
('re-p-12-t-pv15-a', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv15', 'aaf99d34-5bcb-4605-bd09-8fd0972a8290', 'viga', 'Viga:  viimases taktis on decresc kahvel puudu.'),
('re-p-12-t-pv15-t', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv15', '53bf94fb-0028-42b0-a3f4-ceb7fa6e7724', 'õige', NULL),
('re-p-12-t-pv15-b', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv15', '175f7171-bfc1-416e-a65d-600cf9d85eca', 'õige', NULL),
('re-p-12-t-wp01', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-wp01', NULL, 'õige', NULL),
('re-p-12-t-wp02', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-wp02', NULL, 'ettepanek', 'Ettepanek: helilooja nimi on puudu. Mina lisaksin, sest tegemist on üksiku noodiga, mitte kogumikuga. Kui keegi ainult seda nooti kasutab, siis ta ei tea, kes autor on.'),
('re-p-12-t-wp03', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-wp03', NULL, 'õige', 'olemas, teksti päritolu pealkirja all'),
('re-p-12-t-wp08', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-wp08', NULL, 'õige', NULL),
('re-p-12-t-wp09', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-wp09', NULL, 'õige', NULL),
('re-p-12-t-pv10', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv10', NULL, 'ettepanek', 'Ettepanek: noteeriksin loo koorifakuuris S+A ühele reale ja T+B teisele reale. Nii saab lugu ka harmooniliselt lugeda (laulja näeb visuaalselt, kui kusagil on unison või oktav või mis intervall kusagil tekib). Lisaks on koorifaktuur alati kompaktsem ja noot seega lühem. Iga hääl oma real kasutaksin siis, kui hääled omavahel väga risti lähevad ja on raske lugeda, kelle noodipead kusagil on.'),
('re-p-12-t-pv11', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-pv11', NULL, 'õige', 'õige, olemas'),
('re-p-12-t-wp04', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-wp04', NULL, 'õige', NULL),
('re-p-12-t-wp05', 'ec0fb85b-ba62-40b9-b65f-e6a9ee66231f', 'p-12-t-wp05', NULL, 'viga', 'Viga: kirjas on poole kiirem tempo. Õige on 60.');