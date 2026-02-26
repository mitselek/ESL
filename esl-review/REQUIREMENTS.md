# Nootide ülelugemise veebiäpp — Nõuded ja arhitektuur

**Projekt:** Lihula laulupäev 2026 (laiendatav teistele üritustele)
**Stäkk:** SvelteKit 2 + Svelte 5, Cloudflare Pages/Workers, D1, Tailwind v4, pnpm
**Versioon:** v1

---

## Eesmärk

Asendada noodikorrektori (Liisa Rahusoo) praegune Excel + e-mail töövoog veebiäpiga, kus:

- PDF noot on nähtav kõrvuti tagasiside vormiga
- Tagasiside on struktureeritud (häälerühm × parameeter × tulemus)
- Nootide staatused on jälgitavad dashboardis
- Tulemused on eksporditavad CSV/XLSX kujul

---

## Kasutajad

- **Noodikorrektor** (Liisa, Reeda) — kontrollib noote, annab tagasisidet
- **Noodigraafik** (Mihkel/¡n!) — vaatab tagasisidet, parandab noote
- Autentimist v1-s pole — juurdepääs jagatud linkide kaudu

---

## Vaated

### 1. Dashboard (avaleht)

Prototüüp: `Lihula laulupäev/lihula-dashboard.jsx` "Laulude seis" vaade

- Progressiriba: valmis / ootab / küljendamata
- Nootide nimekiri grupeeritud osade kaupa (I–IV)
- Iga noot: pealkiri, helilooja, staatus (värvikoodiga)
- Noodi peale klõpsates avaneb süvavaade
- Filtrid: osa, staatus

### 2. Noodi süvavaade (split-view)

- **Vasak pool:** PDF kuvamine (pdf.js, lehekülgede kaupa)
- **Parem pool:** tagasiside vorm
- **Mobiilil:** tabs (PDF / Vorm) vahetamine

---

## Kasutajalood

### US-01: Noodi registreerimine

Noodigraafik sisestab noodi põhiandmed: pealkiri, helilooja, sõnade autor, osa (I–IV), häälerühmad.

- Häälerühmad on vabalt konfigureeritavad: S, A, T, B, S1, S2, SSA, SSAATTBB jne
- Parameetrite vaikekomplekt kopeeritakse automaatselt (Liisa nimekiri)
- Parameetreid saab noodi tasandil aktiveerida/deaktiveerida ja ümber järjestada

### US-02: Tagasiside sisestamine (per-voice parameetrid)

Korrektor annab iga parameetri kohta iga häälerühma lõikes hinnangu.

**Per-voice parameetrid** (Liisa CSV põhjal):

| #   | Parameeter                        |
| --- | --------------------------------- |
| 1   | Noodikõrgused                     |
| 2   | Pausid                            |
| 3   | Rütmid                            |
| 4   | Sõnad (tekst)                     |
| 5   | Strihhid                          |
| 6   | Pidekaared                        |
| 7   | Legatokaared                      |
| 8   | Fermaadid                         |
| 9   | Jagunemised                       |
| 10  | Häälerühmade paigutus süsteemides |
| 11  | Häälerühmade tähised süsteemi ees |
| 12  | Kordusmärgid                      |
| 13  | Kordusmärgid sõnadega             |
| 14  | Vormiosade tähised                |
| 15  | Dünaamika tähised                 |
| 16  | Dünaamika sõnadega                |

**Tulemuse valikud:** Õige | Viga | Ettepanek | Ei kohaldu (-)

- "Viga" ja "Ettepanek" → kohustuslik tekstiväli kirjeldusega
- Valikuline taktinumbri viide (number või vahemik, nt "5", "13-16")
- Mitu märkust sama lahtris (nt eri taktid)

### US-03: Tagasiside sisestamine (kogu noodi parameetrid)

Korrektor annab kogu noodi kohta ühe hinnangu (mitte häälerühmade kaupa).

**Kogu noodi parameetrid:**

| #   | Parameeter                           |
| --- | ------------------------------------ |
| 1   | Pealkiri                             |
| 2   | Helilooja                            |
| 3   | Sõnade autor                         |
| 4   | Tempo tähis loo alguses              |
| 5   | Tempo, dünaamika jm tähised loo sees |
| 6   | Täpsustavad tekstid loo sees         |
| 7   | Täpsustavad tekstid noodi all        |

### US-04: Reaalajas ülevaade

- Päises: vigade arv, ettepanekute arv, kontrollitud lahtrite arv
- Värvikoodid: roheline=õige, punane=viga, kollane=ettepanek, hall=ei kohaldu
- Filtrid: ainult vead / ainult ettepanekud / kõik

### US-05: Eksport

- **CSV** — Liisa formaadis: rida=parameeter, veerg=häälerühm
- **XLSX** — sama formaat, vormindatud (SheetJS)
- Automaatne failinimi: `YYYY-MM-DD-pealkiri-ülelugemine.csv`

### US-06: Mitme noodi haldus

- Dashboard kuvab kõik noodid staatusega
- Noodi saab avada, jätkata, kustutada
- Projekti kontekst (nt "Lihula laulupäev 2026") koondab seotud noodid

### US-07: Autosave

- Iga muudatus salvestatakse automaatselt (debounce 1s)
- Midagi ei lähe kaduma, "salvesta" nuppu pole vaja

### US-08: Jagatud lingid

- Iga ülelugemine saab unikaalse share_token lingi
- Link annab lugemis- ja ekspordijuurdepääsu (ilma sisselogimiseta)

---

## Noodi elutsükkel (pieces.status)

```text
puudu → küljenduses → ootab_ülelugemist → ülelugemises →
parandused_esitatud → parandamisel → valmis → levitatud
```

| Staatus             | Kes muudab        | Tähendus                      |
| ------------------- | ----------------- | ----------------------------- |
| puudu               | graafik           | Nooti pole veel               |
| küljenduses         | graafik           | Mihkel töötab                 |
| ootab_ülelugemist   | graafik           | PDF valmis, ootab korrektorit |
| ülelugemises        | korrektor         | Liisa/Reeda kontrollib        |
| parandused_esitatud | korrektor         | Tagasiside olemas             |
| parandamisel        | graafik           | Mihkel töötab parandusi       |
| valmis              | graafik/korrektor | Mõlemad kinnitanud            |
| levitatud           | graafik           | Google Drive'is üleval        |

---

## Andmemudel (D1 / SQLite)

6 tabelit:

```sql
-- 1. Noodipalad
CREATE TABLE pieces (
  id         TEXT PRIMARY KEY,
  title      TEXT NOT NULL,
  composer   TEXT,
  origin     TEXT,
  section    TEXT,
  status     TEXT DEFAULT 'puudu',
  pdf_url    TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- 2. Häälerühmad (konfigureeritav per noot)
CREATE TABLE voice_parts (
  id         TEXT PRIMARY KEY,
  piece_id   TEXT NOT NULL REFERENCES pieces(id),
  name       TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 3. Parameetrite mallid (admin-hallatav)
CREATE TABLE param_templates (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  scope      TEXT NOT NULL DEFAULT 'per_voice',
  sort_order INTEGER DEFAULT 0,
  is_default INTEGER DEFAULT 1
);

-- 4. Noodi-spetsiifilised parameetrid
CREATE TABLE piece_params (
  id          TEXT PRIMARY KEY,
  piece_id    TEXT NOT NULL REFERENCES pieces(id),
  template_id TEXT NOT NULL REFERENCES param_templates(id),
  sort_order  INTEGER DEFAULT 0,
  is_active   INTEGER DEFAULT 1
);

-- 5. Ülelugemise sessioonid
CREATE TABLE reviews (
  id          TEXT PRIMARY KEY,
  piece_id    TEXT NOT NULL REFERENCES pieces(id),
  reviewer    TEXT NOT NULL,
  status      TEXT DEFAULT 'in_progress',
  share_token TEXT UNIQUE,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- 6. Üksikud hinnangud
CREATE TABLE review_entries (
  id            TEXT PRIMARY KEY,
  review_id     TEXT NOT NULL REFERENCES reviews(id),
  param_id      TEXT NOT NULL REFERENCES piece_params(id),
  voice_part_id TEXT REFERENCES voice_parts(id),
  verdict       TEXT NOT NULL,
  comment       TEXT,
  created_at    TEXT DEFAULT (datetime('now'))
);
```

**verdict väärtused:** `ok` | `error` | `suggestion` | `na`

---

## API endpointid

```text
GET  /api/pieces                       — nootide nimekiri (dashboard)
GET  /api/pieces/[id]                  — noot koos häälerühmade ja parameetritega
POST /api/pieces                       — uus noot

GET  /api/params                       — parameetrite mallid

POST /api/reviews                      — uus ülelugemine
GET  /api/reviews/[id]                 — ülelugemine koos entry'dega
PUT  /api/reviews/[id]                 — uuenda staatust
PUT  /api/reviews/[id]/entries         — bulk upsert (autosave)

GET  /api/reviews/[id]/export?format=csv    — CSV eksport
GET  /api/reviews/[id]/export?format=xlsx   — XLSX eksport

GET  /r/[share_token]                  — jagatud link vaade
```

---

## Svelte 5 komponentide hierarhia

```text
routes/
├── +page.svelte                  — Dashboard
├── pieces/[id]/
│   └── +page.svelte              — Noodi süvavaade (split-view)
├── r/[token]/
│   └── +page.svelte              — Jagatud link
└── api/
    ├── pieces/
    ├── params/
    └── reviews/

lib/components/
├── PdfViewer.svelte              — pdf.js wrapper
├── ReviewForm.svelte             — tagasiside vorm
├── VoiceParamGrid.svelte         — maatriks (per-voice)
├── WholeParamRow.svelte          — rida (kogu noodi)
├── VerdictRadio.svelte           — ok/viga/ettepanek/na
├── ProgressBar.svelte            — dashboardi progressiriba
└── PieceCard.svelte              — noodi kaart nimekirjas

lib/server/
├── db.ts                         — D1 ühendus
└── export.ts                     — CSV/XLSX generaator
```

---

## Mittefunktsionaalsed nõuded

| Nõue            | Kirjeldus                                                  |
| --------------- | ---------------------------------------------------------- |
| Mobiilisõbralik | Tahvelarvutil kasutatav (korrektor töötab noodiga kõrvuti) |
| Eesti keel      | Kogu UI eestikeelne (v1)                                   |
| Jõudlus         | 30+ parameetrit × 4 häälerühma tabel peab olema sujuv      |
| PDF             | pdf.js, lehekülgede kaupa rendermine                       |
| XLSX            | SheetJS (Workers-ühilduv)                                  |
| Autosave        | Debounce 1s, midagi ei lähe kaduma                         |

---

## v2 (tulevikus)

- Autentimine (Google OAuth / Cloudflare Access)
- PDF versiooniajalugu
- Teavitused (staatus muutub → e-mail)
- Mitme korrektori koostöö
- Versiooniajalugu (kes, millal, mida muutis)

---

## Viited

- Liisa tagasiside näidis: `Lihula laulupäev/docs/Nootide kontrollimine.xlsx - Millal saame sinna maale.csv`
- Dashboardi prototüüp: `Lihula laulupäev/lihula-dashboard.jsx`
- Programm ja staatused: `Lihula laulupäev/KAVA-JA-NOODID.md`
- Registreerimisvormi info: `Lihula laulupäev/docs/registreerimisvorm.md`
