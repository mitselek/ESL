# Arvo — Arhitektuuriülevaatuse märkmed

## Kehtiv arhitektuur (2026-02-26)

### Andmemudel — 7 tabelit

users (id, email, name, picture — ILMA globaalse rollita), pieces (+ typesetter_id FK, + reviewer_id FK, pdf_url=viimane versioon), voice_parts, param_templates, piece_params, reviews (pdf_url=konkreetne revision, ILMA share_token'ita), review_entries (remarks JSON).

### Rollimudel — noodi-põhine

- Globaalset rolli pole. Kasutaja on identiteet, roll tuleneb noodist.
- `pieces.typesetter_id` = selle noodi graafik
- `pieces.reviewer_id` = selle noodi korrektor
- Sama kasutaja võib olla ühe noodi graafik ja teise korrektor
- Admin-töö (nootide lisamine, parameetrite mallid, kasutajad) tehakse Wrangler CLI kaudu

### Elutsükkel — 8 staatust + loop + otsetee

`teos → lähtefail → küljendus → korrektuur → kontrollitud → parandatud → kinnitus → publitseeritud`
Loop: `kinnitus → korrektuur` (ei kinnita). Otsetee: `kontrollitud → kinnitus` (0 viga).
Iga ring = uus review. `kontrollitud` lisatud, sest korrektuur→parandatud jättis vahele "tagasiside olemas, aga pole veel parandatud" faasi.

### Auth ja juurdepääs

- Cloudflare Access + Google IDP (login provider)
- Cf Access: bypass kogu äpp (ei blokeeri)
- Auth kontroll APP-TASEMEL: GET = alati lubatud, POST/PUT = nõuab JWT-d
- Kogu äpp on avalikult loetav (dashboard, noodid, ülelugemised — read-only)
- Auth vajalik ainult kirjutamiseks

### API pind (kehtiv)

```
GET  /api/me                          — kasutaja andmed (null kui pole auth'd)
GET  /api/pieces                      — dashboard (avalik)
GET  /api/pieces/[id]                 — detailvaade (avalik)
PUT  /api/pieces/[id]/claim           — typesetter'iks hakkamine (auth)
PUT  /api/pieces/[id]/assign-reviewer — korrektori määramine (auth)
PUT  /api/pieces/[id]/status          — staatuse muutmine (auth)
GET  /api/users                       — kasutajate nimekiri (auth? avalik?)
POST /api/reviews                     — uus ülelugemine (auth)
GET  /api/reviews/[id]                — review detailid (avalik)
PUT  /api/reviews/[id]                — review staatuse uuendamine (auth)
PUT  /api/reviews/[id]/entries        — bulk upsert / autosave (auth)
```

### Komponentide muster

Üks URL, mitu olekut. `/pieces/[id]` vaade sõltub auth'ist:
- user=null → readonly (PDF + tagasiside tabel)
- user=typesetter → staatuse muutmine, korrektori määramine
- user=reviewer → tagasiside vorm (interaktiivne)

Komponentidel `readonly` prop, mis sõltub kasutaja kontekstist, mitte route'ist.

---

## Otsuste ajalugu (2026-02-26)

### Kinnitatud otsused

1. **Eksport → v2.** CSV/XLSX pole v1 prioriteet.
2. **Google Auth → v1.** Cloudflare Access + Google IDP.
3. **State machine:** 8 staatust + loop + otsetee. `kontrollitud` lisatud korrektuur ja parandatud vahele.
4. **Rollimudel:** noodi-põhine (asendas globaalset admin/reviewer).
5. **2 FK-d pieces tabelis** (asendas eraldi piece_assignments tabelit). YAGNI.
6. **Remarks JSON:** `review_entries.remarks TEXT` — `[{"bars":"5-8","text":"..."}]`.
7. **Share token KAOB.** Avalik read-only äpp asendab jagatud linke.
8. **App-tasemel auth kontroll** (mitte Cf Access reeglid). Lihtsam konfig, testidega mockitav.
9. **PDF revisionid:** `reviews.pdf_url` = konkreetne PDF versioon, `pieces.pdf_url` = viimane. Review = revision, eraldi tabelit pole vaja.

### REQUIREMENTS.md review — avatud leitud (parandamata)

1. otsused.md: aegunud staatuse nimed "ülelugemises"→"parandused esitatud" (peaks olema korrektuur→parandatud)
2. otsused.md: ekspordi viide süvavaate kirjelduses
3. REQUIREMENTS.md: automaatse ülemineku reegel puudub (review completed → korrektuur→parandatud)
4. REQUIREMENTS.md: state reegli sõnastus (kinnitus→publitseeritud/korrektuur, mitte parandatud→kinnitus)

### CSV analüüsi mustrid (stabiilsed)

- [MUSTER] CSV: per-voice (S/A/T/B) + whole-piece sektsioonid, 16+7 parameetrit
- [MUSTER] Verdict: "õige"/"olemas"=ok, "Ettepanek:..."=suggestion, "Vead:..."=error, "-"=na
- [MUSTER] Dashboard prototüüp: Crimson Pro + JetBrains Mono, soojad toonid (#FAF6F0, #C9A96E)

### Avatud küsimused (2026-02-26 sessiooni lõpp)

1. REQUIREMENTS.md review 4 leidu — tõenäoliselt parandatud team-lead'i poolt, aga pole kinnitatud
2. `kontrollitud` staatus — kas REQUIREMENTS.md-s juba uuendatud? Kontrollida järgmises sessioonis
3. `GET /api/users` — avalik või auth? Pole otsustatud
