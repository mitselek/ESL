# 0005 Dashboard hover-preview + state machine

## Kontekst

Dashboard näitab nootide nimekirja, aga puudub kiire ülevaade noodi seisust. Kasutaja peab iga noodi detailvaatesse klõpsama, et näha PDF-i või töövoo olekut.

Eesmärk: sticky parempoolne paneel, mis näitab alati state machine skeemi ja hoveri korral noodi-spetsiifilist infot (PDF thumbnail, praegune olek, korrektuuri tagasiside).

## Muudetavad failid

```text
src/routes/+page.svelte          — layout: nimekiri + sticky preview paneel
src/routes/+page.server.ts       — lisa review probleemide kokkuvõte
src/lib/components/
  PiecePreviewer.svelte           — UUS: preview paneel (state machine + thumbnail + tagasiside)
```

## State machine skeem

Vertikaalne SVG diagramm kõigi 8 olekuga:

```text
  ○ teos                    — noot lisatud, PDF puudub
  │
  ○ lähtefail               — algnoot üles laetud
  │
  ○ küljenduses             — graafik küljendab
  │
  ○ korrektuuris            — korrektor loeb üle
  │        ↑
  ○ kontrollitud    ────┐   — ülelugemine lõpetatud
  │                     │
  ○ paranduses     ─────┘   — graafik parandab (→ tagasi korrektuuris v kinnitatud)
  │
  ○ kinnitatud              — noot heaks kiidetud
  │
  ○ publitseeritud          — valmis
```

### Visuaal

- **Iga olek**: ring (12px) + nimi + tooltip kirjeldusega
- **Praegune olek**: täidetud ring (STATUS_COLORS), pulse-animatsioon
- **Läbitud olekud**: täidetud ring, tuhmim
- **Tulevased olekud**: tühi ring, hall
- **Transitsioonid**: vertikaaljooned + paranduses→korrektuuris kaarjas nool
- **Tooltipid**: iga oleku ja transitsiooni kohta lühike selgitus

## Preview paneel käitumine

### Vaikeolek (ühtki noodireal ei hoverata)

- State machine skeem ilma esiletõstmiseta (kõik olekud hallid ringid)
- Thumbnail ala tühi

### Hoveri olek (hiir noodi real)

- **State machine**: praegune olek esiletõstetud, läbitud olekud täidetud
- **PDF thumbnail**: `source_pdf_url` renderdatakse PdfVieweriga (height ~200px)
- **Noodi info**: pealkiri, helilooja, graafik, korrektor
- **Korrektuuri tagasiside** (kui `korrektuuris`, `kontrollitud` või `paranduses`):
  - Probleemide nimekiri (viga/ettepanek) koos parameetri nime ja häälega

## Andmed

### Olemasolev (`Piece` interface)

- `status`, `source_pdf_url`, `title`, `composer`, `typesetter`, `reviewer`

### Uus: review probleemid (`+page.server.ts`)

Lisa ühe päringuga kõigi nootide viimase completed review probleemid:

```sql
SELECT r.piece_id, pt.name AS param_name, re.verdict,
       re.remarks, vp.name AS voice_name
FROM reviews r
JOIN review_entries re ON re.review_id = r.id
JOIN piece_params pp ON pp.id = re.param_id
JOIN param_templates pt ON pt.id = pp.template_id
LEFT JOIN voice_parts vp ON vp.id = re.voice_part_id
WHERE r.status = 'completed'
  AND re.verdict IN ('viga', 'ettepanek')
  AND r.created_at = (
    SELECT MAX(r2.created_at) FROM reviews r2
    WHERE r2.piece_id = r.piece_id AND r2.status = 'completed'
  )
ORDER BY r.piece_id, pp.sort_order, re.voice_part_id
```

Tagastab `Record<string, ReviewProblem[]>` (piece_id → probleemid).

```ts
interface ReviewProblem {
  param_name: string;
  verdict: 'viga' | 'ettepanek';
  remarks: string | null;
  voice_name: string | null;
}
```

## Layout

```text
┌─────────────────────────────────────────────────────────┐
│ Stats bar          │ Progress bar                       │
├────────────────────┼────────────────────────────────────┤
│                    │                                    │
│ I OSA              │  ┌─────────────────────────────┐   │
│ ● Millal saame...  │  │  STATE MACHINE              │   │
│ ● Söõge langud     │  │  ○ teos                     │   │
│ ● Kohus koju...    │  │  │                          │   │
│                    │  │  ○ lähtefail                │   │
│ II OSA             │  │  │                          │   │
│ ● Mu süda ärka...  │  │  ● küljenduses ◀ (praegu)   │   │
│ ● Linakatkuja      │  │  ...                        │   │
│ ...                │  ├─────────────────────────────┤   │
│                    │  │  ┌───────────────────┐      │   │
│ III OSA            │  │  │  PDF thumbnail    │      │   │
│ ● Petis peiu       │  │  │  (source_pdf_url) │      │   │
│ ...                │  │  └───────────────────┘      │   │
│                    │  │                             │   │
│ IV OSA             │  │  Söõge langud               │   │
│ ● Valgust          │  │  Cyrillus Kreek             │   │
│ ● Siin meie...     │  │                             │   │
│                    │  │  ⚠ 3 märkust:               │   │
│                    │  │  viga: Noodikõrgused (S)    │   │
│                    │  │  ettepanek: Pausid (A)      │   │
│                    │  └─────────────────────────────┘   │
│                    │                                    │
│  60%               │  40%   sticky, top: 6rem           │
└────────────────────┴────────────────────────────────────┘
```

Mobile (<640px): preview paneel peidetud, nimekiri täislaiuses.

## Teostamise sammud ja rollijaotus

| #   | Samm          | Tegija        | Kirjeldus                                                               |
| --- | ------------- | ------------- | ----------------------------------------------------------------------- |
| 1   | Andmed        | **Sven**      | `+page.server.ts`: review probleemide päring, `reviewProblems` map      |
| 2   | Komponent     | **Veeb**      | `PiecePreviewer.svelte`: SVG state machine + thumbnail + tagasiside     |
| 3   | Integratsioon | **Veeb**      | `+page.svelte`: hover state, flex layout (60/40), import PiecePreviewer |
| 4   | Deploy + test | **Team-lead** | `pnpm build`, deploy, laiv test                                         |

### Samm 1: `+page.server.ts` (Sven)

- Lisa üks SQL päring probleemide saamiseks (viga/ettepanek entries viimase completed review kohta)
- Grupeeri `piece_id` järgi → `Record<string, ReviewProblem[]>`
- Tagasta `{ pieces, user, reviewProblems }`

### Samm 2: `PiecePreviewer.svelte` (Veeb)

- Props: `hoveredPiece`, `problems`, `statusColors`
- **SVG state machine**: vertikaalne skeem 8 olekuga, tooltipid igale olekule ja transitsioonile, pulse praegusele olekule, täidetud ringid läbitud olekutele
- **PDF thumbnail**: PdfViewer `height="200px"`, ainult kui `hoveredPiece?.source_pdf_url`
- **Info**: pealkiri, helilooja, graafik, korrektor
- **Tagasiside**: probleemide list (verdict badge + param nimi + hääl + märkused)

### Samm 3: `+page.svelte` (Veeb)

- `hoveredPiece` state, ridadele `onmouseenter`/`onmouseleave`
- Flex layout: nimekiri (flex: 3) + sticky preview (flex: 2, `position: sticky; top: 6rem`)
- Mobile (<640px): preview `display: none`

## Verifitseerimine

- `pnpm build` — kompileerub
- Deploy ja testi:
  - Dashboard näitab state machine skeemi alati
  - Hoveri korral: PDF thumbnail laeb, olek esiletõstetud, tagasiside nähtav
  - Mobile: preview peidetud, nimekiri normaalne
  - Olemasolevad testid (`pnpm vitest run`) rohelised
