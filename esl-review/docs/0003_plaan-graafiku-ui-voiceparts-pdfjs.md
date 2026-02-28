# Plaan: graafiku UI pärast korrektuuris + voice_parts haldus + PDF.js + UX parandused

## Kontekst

Iteratsioon 0002 (source_pdf + split-view) on valmis, 107 testi rohelised, frontend töötab. Testimise käigus tuvastati neli teemade rühma, mis vajavad järgmist iteratsiooni.

## Prioriteedid

| #   | Teema                           | Prioriteet | Maht  |
| --- | ------------------------------- | ---------- | ----- |
| 1   | Graafiku UI pärast korrektuuris | Kõrge      | ~2h   |
| 2   | voice_parts seadistamine        | Kõrge      | ~3h   |
| 3   | PDF.js integratsioon            | Keskmine   | ~4-6h |
| 4   | UX parandused                   | Keskmine   | ~2h   |

---

## 1. Graafiku UI pärast korrektuuris

**Probleem:** Kui korrektor lõpetab ülelugemise ja noot on `kontrollitud` staatuses, pole graafikul (typesetter) frontendis viisi märkusi vaadata ega staatust edasi viia. Backend `PUT /api/pieces/[id]/status` on olemas ja toetab:

```text
kontrollitud → paranduses  (typesetter)
kontrollitud → kinnitatud  (typesetter)
paranduses   → kinnitatud  (reviewer)
paranduses   → korrektuuris (reviewer)
kinnitatud   → publitseeritud (typesetter)
```

**Vajalik frontend:**

### 1a. Korrektori märkuste vaade (kontrollitud staatus)

`+page.svelte` — graafik näeb noodi detailvaates:

- Viimase review entry-de kokkuvõtet (verdikt + märkused)
- Kui kõik `õige` → roheline: "Kõik korras"
- Kui on `viga` või `ettepanek` → punane/kollane: loetelu probleemidest

**Andmed:** `data.activeReview.entries` on juba olemas page load-is (kui review on `completed`). Kontrollida, kas `+page.server.ts` laeb ka lõpetatud review — vajadusel lisada query.

### 1b. Staatuse nupud

```svelte
{#if isTypesetter && piece.status === 'kontrollitud'}
  <button onclick={() => setStatus('paranduses')}>Parandan</button>
  <button onclick={() => setStatus('kinnitatud')}>Kinnita</button>
{/if}

{#if isReviewer && piece.status === 'paranduses'}
  <button onclick={() => setStatus('kinnitatud')}>Kinnita</button>
  <button onclick={() => setStatus('korrektuuris')}>Tagasi korrektuuris</button>
{/if}

{#if isTypesetter && piece.status === 'kinnitatud'}
  <button onclick={() => setStatus('publitseeritud')}>Publitseeri</button>
{/if}
```

`setStatus()` kutsub `PUT /api/pieces/[id]/status` ja teeb `window.location.reload()`.

### 1c. Dashboard staatuse värvid

Dashboard (`+page.svelte` juurlehel) näitab juba värvid `kontrollitud`, `paranduses`, `kinnitatud`, `publitseeritud` jaoks — kontrollida, et need on nähtavad ja loogilised.

---

## 2. voice_parts seadistamine

**Probleem:** Praegu tuleb `voice_parts` käsitsi SQL-ga lisada (`wrangler d1 execute`). Graafikul peaks olema UI häälerühmade haldamiseks.

### 2a. Backend: CRUD voice_parts

**Uus fail:** `src/lib/server/api/voice-parts.ts` + `.spec.ts`
**Route:** `src/routes/api/pieces/[id]/voice-parts/+server.ts`

Endpointid:

- `GET /api/pieces/[id]/voice-parts` — tagastab loetelu (juba olemas `getPiece()` kaudu, eraldi endpoint pole ilmtingimata vajalik)
- `POST /api/pieces/[id]/voice-parts` — lisa häälerühm
  - Body: `{ name: string, sort_order?: number }`
  - Auth: ainult typesetter (`piece.typesetter_id === user.id`)
  - Genereerib UUID `id`
- `DELETE /api/pieces/[id]/voice-parts/[vpId]` — kustuta häälerühm
  - Auth: ainult typesetter
  - Guard: ei saa kustutada, kui review_entries viitab sellele voice_part_id-le

**Vaikeväärtused:** Tüüpilised kooripartituurid:

```text
S (sopran), A (alt), T (tenor), B (bass)
```

Graafik saab neid lisada/eemaldada/ümber nimetada vastavalt noodile.

### 2b. Frontend: voice_parts seadistamine

Kaks varianti, millal UI näidata:

**Variant A:** Eraldi seadete sektsioon noodi detailvaates (alati nähtav graafikule)
**Variant B:** Küljendamise alustamisel (pärast claim, enne korrektori määramist)

Soovitus: **Variant A** — lihtne loetelu + "Lisa häälerühm" sisestusväli + kustutamisnupp. Nähtav kui `isTypesetter`.

```svelte
{#if isTypesetter}
  <section>
    <h3>Häälerühmad</h3>
    {#each piece.voice_parts as vp}
      <div>{vp.name} <button onclick={() => deleteVoicePart(vp.id)}>x</button></div>
    {/each}
    <input bind:value={newVpName} placeholder="Lisa häälerühm..." />
    <button onclick={addVoicePart}>Lisa</button>
  </section>
{/if}
```

### 2c. piece_params automaatne loomine

Kui voice_parts muutuvad, peavad `piece_params` tabelis olema vastavad read (per_voice parameetrite jaoks). Praegu loob neid `seed.sql`. Kaks lähenemist:

**Lähenemine A:** Backend loob automaatselt `piece_params` read, kui neid pole (lazy init)
**Lähenemine B:** `POST /voice-parts` endpoint loob ka vastavad `piece_params` read

Soovitus: **Lähenemine B** — selge ja jälgitav. Voice part lisamise endpoint loob ka kõik `is_default = 1` param_templates jaoks `piece_params` read.

---

## 3. PDF.js integratsioon

**Probleem:** Native PDF viewer (iframe `src=*.pdf`) ei toeta scroll-link (cross-origin piirangutest sõltumata — isegi same-origin puhul on PDF viewer eraldi kontekst), zoom-kontrolli ega annotatsioone. Praegune scroll-link töötab ainult juhul, kui brauser renderdab PDF-i HTML-ina (ei tööta).

### 3a. PDF.js setup

**Pakett:** `pdfjs-dist` (npm)

**Worker fail:** PDF.js vajab `pdf.worker.min.mjs` faili. Cloudflare Pages/Workers keskkonnas:

- Variant A: `static/` kausta (lihtne, aga suur fail ~800KB)
- Variant B: CDN-ist (cdnjs/unpkg) — lisab välise sõltuvuse
- Soovitus: **Variant A** — same-origin, kontrollitav versioon

### 3b. PDF viewer komponent

**Uus fail:** `src/lib/components/PdfViewer.svelte`

Props:

- `url: string` — PDF URL
- `onScroll?: (ratio: number) => void` — scroll callback
- `scrollTo?: number` — sihtpositsioon (0-1 ratio)

Funktsioonid:

- Canvas-põhine renderdamine (lehe kaupa)
- Zoom in/out nupud
- Lehe navigatsioon (eelmine/järgmine + number input)
- Scroll event callback (scroll-link jaoks)

### 3c. Scroll-link refaktoreerimine

Praegune iframe-põhine `syncScroll()` asendada PDF.js callback-idega:

```ts
function onLeftScroll(ratio: number) {
  if (scrollLinked) rightViewer.scrollTo(ratio);
}
function onRightScroll(ratio: number) {
  if (scrollLinked) leftViewer.scrollTo(ratio);
}
```

See on usaldusväärsem kui iframe contentWindow manipuleerimine.

### 3d. Tuleviku võimalused (ei selle iteratsiooni skoop)

- Annotatsioone otse PDF-ile (marker, highlight)
- Taktinumbri hüpped (vajab PDF analüüsi)

---

## 4. UX parandused

### 4a. File input + upload nupp → auto-upload

**Praegu:** Kasutaja valib faili + vajutab eraldi "Lae üles" nuppu.
**Parem:** File input `onchange` käivitab kohe uploadi. Nupp pole vajalik.

```svelte
<input
  type="file"
  accept=".pdf"
  onchange={(e) => {
    const file = e.target.files?.[0];
    if (file) uploadAndSetSourcePdf(file);
  }}
/>
```

Kuvab uploadi progressi (spinner/tekst) faili nime kõrval.

### 4b. "PDF puudub" kui source_pdf_url on olemas

**Praegu:** Kui `hasDualPdf` on `false` ja `pdf_url` on `null`, näitab "PDF puudub" (rida 419). Aga `source_pdf_url` võib olla olemas.

**Parandus:** Kui `source_pdf_url` on olemas aga `pdf_url` puudub, näita source PDF-i (ainult vaade) + teadet "Küljenduse PDF puudub":

```svelte
{:else if piece.source_pdf_url}
  <iframe src={piece.source_pdf_url} ... title="Algnoot" />
  <p>Küljenduse PDF pole veel lisatud</p>
{:else}
  <div>PDF puudub</div>
{/if}
```

### 4c. Profiilileht

Lihtne `/profile` leht, mis näitab:

- Kasutaja nimi, email, pilt (Google Auth-ist)
- Noote, mille typesetter on kasutaja (loetelu linkidega)
- Noote, mille reviewer on kasutaja
- Statistika: mitu nooti küljendatud, mitu üle loetud

Backend: `GET /api/me` on juba olemas — tagastab kasutaja andmed. Noote saab filtreerida `GET /api/pieces?typesetter=me` vms parameetriga (vajab backend lisandust).

---

## Teostamise järjekord

| Samm | Ülesanne                                     | Tess | Sven  | Arvo   | Veeb |
| ---- | -------------------------------------------- | ---- | ----- | ------ | ---- |
| 1    | Graafiku UI: staatuse nupud + märkuste vaade | —    | —     | —      | impl |
| 2    | voice_parts CRUD: spec → impl → route        | red  | green | review | —    |
| 3    | voice_parts frontend                         | —    | —     | —      | impl |
| 4    | UX: auto-upload, "PDF puudub" parandus       | —    | —     | —      | impl |
| 5    | PDF.js: PdfViewer komponent                  | —    | —     | —      | impl |
| 6    | PDF.js: scroll-link refaktoreerimine         | —    | —     | review | impl |
| 7    | Profiilileht: backend laiendus + frontend    | red  | green | review | impl |

**Rollid (nagu varem):**

- **Tess** — failing testid (red phase)
- **Sven** — testid roheliseks + deploy (green phase)
- **Arvo** — koodiülevaatus
- **Veeb** — frontend (Svelte komponendid, UX)
- **Team-lead** — koordineerimine, commitimine, otsused

## Sõltuvused

- Samm 1 ei sõltu millestki (backend olemas)
- Samm 3 sõltub sammust 2 (voice_parts CRUD peab olemas olema)
- Samm 5 ei sõltu — saab paralleelselt alustada
- Samm 6 sõltub sammust 5

## Verifitseerimine

- `pnpm test` — kõik testid rohelised (k.a uued voice_parts testid)
- Laiv test: kontrollitud → graafik näeb märkusi → vajutab "Parandan" → paranduses
- Laiv test: graafik lisab/kustutab häälerühmi → korrektor näeb neid review vormis
- PDF.js: scroll-link töötab mõlemas suunas, zoom, lehe nav
- Mobiil: kõik vaated töötavad < 640px
