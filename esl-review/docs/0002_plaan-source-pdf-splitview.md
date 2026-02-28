# Plaan: source_pdf_url + state machine + dual split-view

## Kontekst

Praegu on pieces tabelis üks `pdf_url` väli ja state machine on poolik (claim ei muuda staatust, pole viisi algnoodikiri lisamiseks). Korrektor näeb ainult ühte PDF-i. Vaja on eraldi `source_pdf_url` (algnoot) + `pdf_url` (draft küljendus), korralik state machine, ja korrektori split-view koos flip + scroll-link funktsiooniga.

## 0. Cloudflare R2 failihaldus

PDF-id hostitakse Cloudflare R2-s (same-origin → scroll-link töötab, failid meie kontrolli all).

**Setup:**

- Bucket: `esl-pdfs`
- `wrangler.toml`: lisa `[[r2_buckets]]` binding `PDF_BUCKET`
- Avalik ligipääs: R2 custom domain või Pages worker kaudu (`/pdf/*` route)

**Upload endpoint:** `POST /api/upload`

- Auth: ainult autentitud kasutajad
- Multipart form data: `file` (PDF)
- Tagastab: `{ url: '/pdf/failinimi.pdf' }`
- R2 key: `{piece_id}/{timestamp}-{filename}` (versioonihaldus)
- Max 20MB

**Serveerimise route:** `GET /pdf/[...path]`

- Loeb R2-st, serveerib `Content-Type: application/pdf` + `Content-Disposition: inline`
- Same-origin = iframe + scroll-link töötab

**Olemasolevad static/pdf/ failid:** migreeritakse R2-sse, seejärel kustutatakse `static/pdf/` kaustast.

## 1. Migratsiooni fail

**Uus fail:** `migrations/0002_source_pdf.sql`

```sql
ALTER TABLE pieces ADD COLUMN source_pdf_url TEXT;
ALTER TABLE pieces ADD COLUMN pageflow_matched INTEGER DEFAULT 0;
```

- `source_pdf_url` — algnoot (originaal)
- `pageflow_matched` — graafik märgib, kas tegi 1:1 pageflow (korrektor saab scroll-linked vaate)

Käivitada: `wrangler d1 execute esl-review --remote --file=migrations/0002_source_pdf.sql`

Kõik spec-failid peavad ka uue migratsiooni rakendama (openSeededDb helper).

## 2. Uus endpoint: `PUT /api/pieces/[id]/source-pdf`

Algnoot lisamine. Iga autentitud kasutaja saab teha.

- **Fail:** `src/lib/server/api/set-source-pdf.ts` + `.spec.ts`
- **Route:** `src/routes/api/pieces/[id]/source-pdf/+server.ts`
- **Loogika:**
  1. Piece ei leitud → 404
  2. `source_pdf_url` puudu/tühi → 400
  3. UPDATE `source_pdf_url`, kui staatus `teos` → muuda `lähtefail`
  4. Muu staatuse puhul URL uuendatakse, staatus ei muutu

## 3. Claim uuendus

**Fail:** `src/lib/server/api/claim.ts` + `.spec.ts`

Praegu: seab ainult `typesetter_id`, ei muuda staatust.
Uus:

- Status guard: ainult `teos` või `lähtefail` → saab claimida
- Muudab staatuse → `küljenduses`
- UPDATE: `SET typesetter_id = ?, status = 'küljenduses'`

## 4. Assign-reviewer uuendus

**Fail:** `src/lib/server/api/assign-reviewer.ts` + `.spec.ts`
**Route:** `src/routes/api/pieces/[id]/assign-reviewer/+server.ts`

Uus signatuur: `assignReviewer(db, pieceId, reviewerId, pdfUrl, pageflowMatched, user)`

- `pdf_url` (string, kohustuslik) — graafiku draft PDF
- `pageflow_matched` (boolean, valikuline, default false) — kas 1:1 pageflow
- UPDATE: `SET reviewer_id = ?, pdf_url = ?, pageflow_matched = ?, status = 'korrektuuris'`

## 5. Andmemudelid

**`src/lib/server/api/piece.ts`** — lisa `source_pdf_url` ja `pageflow_matched` PieceDetail-i, PieceRow-i, SQL-i
**`src/lib/server/api/pieces.ts`** — sama Piece interface'i ja PIECES_SQL-i jaoks

## 6. Frontend: piece detail

**Fail:** `src/routes/pieces/[id]/+page.svelte`

### 6a. "Lisa lähtefail" — teos staatuses

```svelte
{#if user && piece.status === 'teos'}
  <input type="file" accept=".pdf" onchange={uploadSourcePdf} />
  <button>Lisa lähtefail</button>
{/if}
```

Upload → `POST /api/upload` → saab URL → `PUT /api/pieces/[id]/source-pdf` → staatus `lähtefail`

### 6b. "Määra korrektor" — küljenduses staatuses

Praegusele dropdownile lisaks:

- Draft PDF file upload (sama upload flow)
- Checkbox: "1:1 pageflow" (`pageflow_matched`)

### 6c. Dual split-view — korrektuuris + mõlemad PDF-id olemas

```text
[Draft PDF (vasak)]  [⇄] [Algnoot (parem)]
          [Review form (all, täislaiuses)]
```

- **Flip nupp** (`⇄`): vahetab vasak/parem
- **Scroll-link**: vaikimisi SEES kui `piece.pageflow_matched === 1`
  - Toggle checkbox: `🔗 Linka kerimine`
  - Scroll sync: protsentuaalne (`scrollTop / scrollHeight`)
  - Cross-origin iframed: try/catch, kui ei saa → keela toggle
- **Mobiil**: kahe PDF-i asemel tabid (< 768px)
- Kui `source_pdf_url` puudub → praegune ühe PDF-i vaade

### 6d. Ühe PDF-i vaade — muud staatused

Kui ainult üks PDF olemas, näita praegust layouti (PDF vasak + vorm parem).

## 7. TRANSITIONS tabel

Praegune tabel on juba õige — ei vaja muutmist:

```text
kontrollitud → paranduses (typesetter) | kinnitatud (typesetter)
paranduses   → kinnitatud (reviewer)   | korrektuuris (reviewer)
kinnitatud   → publitseeritud (typesetter)
```

Automatiseeritud üleminekud (eraldi endpointides):

- `teos → lähtefail` — source-pdf endpoint
- `teos/lähtefail → küljenduses` — claim
- `küljenduses → korrektuuris` — assign-reviewer
- `korrektuuris → kontrollitud` — review complete

## 8. Teostamise järjekord (TDD)

| Samm | Ülesanne                                                                 | Tess                     | Sven          | Arvo     | Veeb |
| ---- | ------------------------------------------------------------------------ | ------------------------ | ------------- | -------- | ---- |
| 1    | R2 setup: bucket, wrangler.toml, upload endpoint, `/pdf/[...path]` route | —                        | ✓             | ✓        | —    |
| 2    | D1 migration + kõik spec-failid uuendatud                                | Tess kirjutab schematest | Sven rakendab | ✓        | —    |
| 3    | `set-source-pdf`: spec → impl → route                                    | ✓ red                    | ✓ green       | ✓ review | —    |
| 4    | `claim` uuendus: spec → impl                                             | ✓ red                    | ✓ green       | ✓ review | —    |
| 5    | `assign-reviewer` uuendus: spec → impl → route                           | ✓ red                    | ✓ green       | ✓ review | —    |
| 6    | `piece.ts` + `pieces.ts`: uued väljad                                    | ✓ red                    | ✓ green       | ✓ review | —    |
| 7    | Frontend: file upload + split-view + vormid                              | —                        | —             | —        | ✓    |
| 8    | Migreeri `static/pdf/` → R2                                              | —                        | ✓             | —        | —    |
| 9    | Deploy: D1 migration + Pages                                             | —                        | ✓             | —        | —    |

**Rollid:**

- **Tess** — kirjutab failing testid (red phase)
- **Sven** — teeb testid roheliseks + deploy (green phase)
- **Arvo** — koodiülevaatus enne committi
- **Veeb** — frontend (Svelte komponendid, UX)
- **Team-lead (mina)** — koordineerin, commitin, otsustan

## 9. Verifitseerimine

- `pnpm test` — kõik testid rohelised
- Laiv test: teos → lisa lähtefail → võta küljendada → määra korrektor (draft + pageflow) → korrektori split-view
- Kontrolli: scroll-link default on/off vastavalt pageflow_matched lipule
- Mobiil: tabid kahe PDF-i vaatamiseks
