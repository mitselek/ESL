# Arvo — Arhitektuuriülevaatuse märkmed

## Kehtiv arhitektuur (2026-02-26)

### Andmemudel — 7 tabelit

users (id, email, name, picture — ILMA globaalse rollita), pieces (+ typesetter_id FK, + reviewer_id FK, pdf_url=viimane versioon), voice_parts, param_templates, piece_params, reviews (pdf_url=konkreetne revision, ILMA share_token'ita), review_entries (remarks TEXT — nii JSON kui plain string).

### Rollimudel — noodi-põhine

- Globaalset rolli pole. Kasutaja on identiteet, roll tuleneb noodist.
- `pieces.typesetter_id` = selle noodi graafik
- `pieces.reviewer_id` = selle noodi korrektor
- Sama kasutaja võib olla ühe noodi graafik ja teise korrektor
- Admin-töö (nootide lisamine, parameetrite mallid, kasutajad) tehakse Wrangler CLI kaudu

### Elutsükkel — 8 staatust + loop + otsetee

`teos → lähtefail → küljendus → korrektuur → kontrollitud → parandatud → kinnitus → publitseeritud`
Loop: `kinnitus → korrektuur` (ei kinnita). Otsetee: `kontrollitud → kinnitus` (0 viga).

### Auth ja juurdepääs

- Cloudflare Access + Google IDP — CF Access blokeerib unauthenticated (302 → login)
- Auth kontroll APP-TASEMEL: GET = alati lubatud, POST/PUT = nõuab JWT-d
- Kogu äpp on avalikult loetav (dashboard, noodid, ülelugemised — read-only)

### DB seis pärast migratsiooni (2026-03-06)

- **27 param_templates**: 12 per_voice + 15 whole_piece (t-wp10 Võtmed lisatud, t-pv10..14 scope muudetud)
- **540 piece_params**: 20 nooti * 27 parameetrit
- **85 voice_parts**: 20 nooti (p-05/06: 6, p-11: 5, ülejäänud: 4)
- **310 review_entries**: 8 noodi peale (214 õige, 49 viga, 47 ettepanek)
- **FK integrity**: PRAGMA foreign_keys=ON, NO CASCADE, 0 vigast viitet
- **d1_migrations tabel on TÜHI** — kõik rakendatud `wrangler d1 execute` kaudu

---

## DB migratsioon 2026-03-06 — LÕPETATUD

### Sammud (kõik GREEN)

1. param_templates: INSERT t-wp10 + UPDATE 5 scope muutust
2. piece_params (t-wp10) + voice_parts (14 nooti S/A/T/B)
3. Excel import (7 nooti DELETE+INSERT) + p-05 scope-fix

### Leitud ja lahendatud probleemid

- [GOTCHA] t-wp10 oli juba enne migratsiooni olemas (backup näitas) — issue #6 arvas, et uus
- [GOTCHA] p-11 soolo voice_part oli juba olemas — duplikaadikontroll vajalik
- [GOTCHA] p-05 scope-affected entries vajasid eraldi käsitlust (samm 4 ei puudutanud p-05)
- [GOTCHA] Issue #8 (scope migration) oli ebavajalik — samm 4 asendas kogu sisu

### [HOIATUS] Remarks formaadi muutus — 500 viga!

Excel import kirjutas remarks'd **plain string**'ina, mitte JSON-massiivina `[{"text":"..."}]`.
Kaks kohta crashivad `JSON.parse`'iga:

1. `src/routes/+page.server.ts:20` — `parseRemarks()` dashboard
2. `src/lib/server/api/review-get.ts:54` — `parseEntries()` detail API

Üks kliendipoolne koht kaotab andmeid (ei crashi):
3. `src/routes/pieces/[id]/+page.svelte:44-46` — fallback `''` plain stringile

Fix: try/catch JSON.parse, fallback raw stringile.

### [HOIATUS] 0005_excel-migration.sql — EI OLE idempotentne

- Sektsioon 1 (param_templates) ja 3 (voice_parts) kasutavad puhast INSERT'd → PK duplikaadiviga
- Fix: `INSERT OR IGNORE`
- Sektsioon 5 `');DELETE` samal real — kosmeetiline, aga habras

---

## Otsuste ajalugu (2026-02-26)

### Kinnitatud otsused

1. **Eksport → v2.** CSV/XLSX pole v1 prioriteet.
2. **Google Auth → v1.** Cloudflare Access + Google IDP.
3. **State machine:** 8 staatust + loop + otsetee.
4. **Rollimudel:** noodi-põhine (asendas globaalset admin/reviewer).
5. **2 FK-d pieces tabelis** (asendas eraldi piece_assignments tabelit). YAGNI.
6. **Remarks:** `review_entries.remarks TEXT` — nüüd mõlemad formaadid (JSON massiiv + plain string).
7. **Share token KAOB.** Avalik read-only äpp asendab jagatud linke.
8. **App-tasemel auth kontroll.**
9. **PDF revisionid:** `reviews.pdf_url` = konkreetne PDF versioon.

### Süsteemsed YELLOW-d (lahendamata)

- `request.json()` ilma try/catch-ita kõigis PUT endpointides → vigane body → 500
- Array elementide valideerimine `review-entries` endpointis puudub
- `review-complete.ts` kaks eraldi `await` → pole atomaarne

### Arhitektuurilised mustrid

- `piece-status.ts` TRANSITIONS tabel — parim muster staatuste haldamiseks
- `review-entries.ts` `db.batch()` — ainus atomaarne kirjutusoperatsioon
