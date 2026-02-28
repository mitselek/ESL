# 0004 PDF.js integratsioon

## Kontekst

Praegu kuvatakse PDF-e brauseri native PDF vieweriga `<iframe>` kaudu. See ei toeta:

- **Scroll-link**: `contentWindow.document` on native PDF vieweris kättesaamatu, seega praegune kood lülitab scroll-synci alati välja
- **Zoom/fit kontrolli**: kasutaja ei saa lehte sobitada
- **Tulevasi annotatsioone**: iframe'ist ei saa canvas'ele joonistada

PDF.js asendab iframe'd canvas-renderdusega, annab töötava scroll-synci ja auto-fit.

## Skoop

- Asenda 6 iframe'd `<PdfViewer>` Svelte 5 komponendiga
- Tööle page-based scroll-link (`pageflow_matched === 1` korral)
- Auto fit-width (ainuke zoom-režiim, toolbar puudub)
- Andmebaasi ega API muudatusi pole

## Failid

```text
src/lib/components/
  PdfViewer.svelte     — peamine komponent
  pdf-viewer.ts        — helper (loadPdf, renderPage, calcFitScale)
  pdf-viewer.spec.ts   — unit testid helperile
```

## Teostamise järjekord

| #   | Samm          | Tegija        | Kirjeldus                                                                       |
| --- | ------------- | ------------- | ------------------------------------------------------------------------------- |
| 1   | Setup         | **Sven**      | `pnpm add pdfjs-dist`, postinstall script, .gitignore                           |
| 2   | Helper spec   | **Tess**      | `pdf-viewer.spec.ts` — failing testid: loadPdf, renderPage, calcFitScale        |
| 3   | Helper impl   | **Sven**      | `pdf-viewer.ts` — testid roheliseks                                             |
| 4   | Arvo review   | **Arvo**      | Helper koodiülevaatus                                                           |
| 5   | Komponent     | **Veeb**      | `PdfViewer.svelte` — canvas render, IntersectionObserver, fit-width, syncToPage |
| 6   | Integratsioon | **Veeb**      | Asenda 6 iframe'd `+page.svelte`-s, scroll-link loogika, cleanup                |
| 7   | Deploy + test | **Team-lead** | `pnpm build`, deploy, laiv test kõik vaated                                     |

## 1. Setup (Sven)

```bash
pnpm add pdfjs-dist
```

**Worker fail** → `static/`:

```json
// package.json scripts
"postinstall": "cp node_modules/pdfjs-dist/build/pdf.worker.min.mjs static/pdf.worker.min.mjs"
```

**`.gitignore`** — lisa `static/pdf.worker.min.mjs`

## 2. `pdf-viewer.ts` — helper (Tess → Sven → Arvo)

```ts
export async function loadPdf(url: string): Promise<PDFDocumentProxy>;
export async function renderPage(
  pdfDoc: PDFDocumentProxy,
  pageNum: number,
  canvas: HTMLCanvasElement,
  scale: number
): Promise<void>;
export function calcFitScale(viewport: { width: number }, containerWidth: number): number;
```

## 3. `PdfViewer.svelte` — komponent (Veeb)

### Props (Svelte 5)

```ts
let {
  url, // PDF URL
  height = '60vh', // CSS kõrgus
  syncToPage = undefined, // sisend: keritav leht (scroll-link)
  onPageChange = undefined // callback: nähtav leht muutus
}: {
  url: string;
  height?: string;
  syncToPage?: number;
  onPageChange?: (page: number) => void;
} = $props();
```

### Sisemine loogika

1. **`onMount`**: dynamic import `pdfjs-dist` (SSR-safe), set workerSrc
2. **`$effect` → url**: `pdfjsLib.getDocument(url).promise` → pdfDoc, totalPages
3. **Lehtede renderdus**: scrollable konteiner → iga leht `<canvas>` sees `<div class="pdf-page">`
4. **Auto fit-width**: esimese lehe viewport.width → `containerWidth / viewport.width` = scale
5. **Retina**: `canvas.width = viewport.width * dpr`, CSS `width = viewport.width + 'px'`
6. **IntersectionObserver**: rootMargin `200px`, renderdab nähtavad lehed + 1 puhver. Tuvastab `currentPage`.
7. **`syncToPage`**: `$effect` jälgib, muutumisel → `scrollIntoView({ behavior: 'smooth' })`
8. **URL vahetus**: AbortController katkestab eelmise laadimise

### Stiil

- Konteiner: `border: 1px solid #E8DDD0; border-radius: 6px; background: #f5f0e8; overflow-y: auto;`
- Lehed: `background: white; margin: 8px auto; box-shadow: 0 1px 4px rgba(0,0,0,0.1);`
- Laadimine: `color: #888; font-family: 'JetBrains Mono'` — "Laen PDF-i..."

## 4. Integratsioon `+page.svelte` (Veeb)

### Kustutatav kood

- `leftIframe`, `rightIframe`, `scrolling` muutujad
- `syncScroll()`, `attachScrollListeners()` funktsioonid
- Kõik 6 `<iframe>` elementi

### Uus kood

```ts
import PdfViewer from '$lib/components/PdfViewer.svelte';

let leftPage = $state(1);
let rightPage = $state(1);
let syncing = $state(false);

function onLeftPageChange(page: number) {
  leftPage = page;
  if (scrollLinked && !syncing) {
    syncing = true;
    rightPage = page;
    requestAnimationFrame(() => {
      syncing = false;
    });
  }
}
// analoogselt onRightPageChange
```

### Desktop dual-view

```svelte
<PdfViewer
  url={leftUrl}
  height="60vh"
  syncToPage={scrollLinked ? rightPage : undefined}
  onPageChange={onLeftPageChange}
/>
<!-- swap nupp + scroll-link toggle -->
<PdfViewer
  url={rightUrl}
  height="60vh"
  syncToPage={scrollLinked ? leftPage : undefined}
  onPageChange={onRightPageChange}
/>
```

### Scroll-link toggle

Nähtav ainult kui `piece.pageflow_matched === 1`:

```svelte
<button
  onclick={() => {
    scrollLinked = !scrollLinked;
  }}
  style="background: {scrollLinked ? '#2C2416' : '#E8DDD0'}; ..."
>
  🔗
</button>
```

### Mobile dual-view

Synci pole (ainult üks nähtav korraga):

```svelte
<PdfViewer url={activeRedactionUrl} height="60vh" />
```

### Single view

```svelte
<PdfViewer url={piece.pdf_url ?? piece.source_pdf_url} height="70vh" />
```

## 5. Verifitseerimine

- `pnpm vitest run` — olemasolevad 140+ testi rohelised
- `pnpm build` — Vite build OK
- Laiv test:
  - Single-view: PDF renderdub canvas'ile, fit-width
  - Dual-view: mõlemad PDF-d nähtavad, flip nupp töötab
  - Scroll-link: kerib ühte → teine järgneb (pageflow_matched=1)
  - Mobile: tabid töötavad
  - Redaktsiooni vahetamine: PDF laeb uuesti

## 6. Riskid

- **Bundle**: pdfjs-dist ~150KB gzip — aktsepteeritav
- **SSR**: dynamic import `onMount`-is, placeholder renderdub SSR ajal
- **Race condition**: URL vahetusel AbortController katkestab eelmise
