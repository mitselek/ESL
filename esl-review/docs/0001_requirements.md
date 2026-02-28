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
- Autentimine Google kontoga (Cloudflare Access)

---

## Kasutajad ja autentimine

**Autentimine:** Cloudflare Access + Google IDP

- Worker saab `Cf-Access-Jwt-Assertion` headerist kasutaja emaili
- Cloudflare Teams free tier (50 kasutajat)
- Auth koodi pole vaja kirjutada — Cloudflare haldab OAuth voogu
- Esimesel sisselogimisel luuakse kasutajaprofiil automaatselt (email, nimi, pilt)

**Rollid on noodi-põhised, mitte globaalsed.** Kasutajal pole fikseeritud rolli — roll tuleneb seosest noodiga:

- **Graafik** (typesetter) — kasutaja, kes valis noodi küljendamiseks
- **Korrektor** (reviewer) — kasutaja, kelle graafik määras noodi kontrollima

Sama kasutaja võib olla ühe noodi graafik ja teise noodi korrektor.

**Admin-töö** (nootide, parameetrimallide, kasutajate loomine) tehakse **Wrangler CLI + D1 kaudu** otse. Äpis admin-vaadet pole.

**Kogu äpp on avalikult loetav** (read-only). Sisselogitud kasutajad, kellel on noodi-põhine roll, saavad kirjutada. Non-members näevad kõike, aga ei saa midagi muuta.

---

## Vaated

### 1. Dashboard (avaleht)

Prototüüp: `Lihula laulupäev/lihula-dashboard.jsx` "Laulude seis" vaade

- Progressiriba: segmenteeritud värvikoodiga (vt disainisüsteem)
- Nootide nimekiri grupeeritud osade kaupa (I–IV)
- Iga noot: pealkiri, helilooja, staatus (värvikoodiga), graafik, korrektor
- Noodi peale klõpsates avaneb süvavaade
- Filtrid: osa, staatus, "minu noodid"
- Päises statistika: küljendatud/total, kontrollitud/küljendatud, päevi tähtajani
- Omanikuta nootidel: "Võta küljendada" nupp

### 2. Noodi süvavaade (split-view)

- **Vasak pool:** PDF kuvamine (Google Drive'i link / iframe)
- **Parem pool:** tagasiside vorm
- **Mobiilil:** tabs (PDF / Vorm) vahetamine

---

## Disainisüsteem (prototüübist)

**Fondid:** Crimson Pro (serif, põhitekst) + JetBrains Mono (monospace, staatused/labelid)

**Värvid:**

| Element         | Värv                |
| --------------- | ------------------- |
| Taust           | `#FAF6F0`           |
| Tekst           | `#2C2416`           |
| Aktsent (kuld)  | `#C9A96E`           |
| Header gradient | `#2C2416 → #4A3728` |
| Ääris           | `#E8DDD0`           |
| Selection       | `#E8D5B7`           |

**Staatuste värvid:** vt elutsükkel allpool.

---

## Kasutajalood

### US-01: Graafikuks hakkamine

Kasutaja avab dashboardis noodi, millel pole veel graafikut. Ta vajutab "Võta küljendada" ja saab selle noodi graafikuks.

- Eeltingimus: `pieces.typesetter_id IS NULL`
- Tulemus: `pieces.typesetter_id = kasutaja.id`
- Vaba valik — iga sisselogitud kasutaja saab graafikuks hakata

### US-02: Korrektori määramine

Graafik on küljenduse lõpetanud ja valib olemasolevate kasutajate hulgast korrektori. Valik toimub dropdown'ist. Pärast valimist läheb noodi staatus "korrektuur"-i.

- Eeltingimus: kasutaja on selle noodi graafik, staatus on "küljendus"
- Tulemus: `pieces.reviewer_id = valitud_kasutaja.id`, `pieces.status = 'korrektuur'`

### US-03: Tagasiside sisestamine (per-voice parameetrid)

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

- "Viga" ja "Ettepanek" → kohustuslik märkuste tabel:

  ```json
  [
    { "bars": "5-8", "text": "Kolmas noot peaks olema F#" },
    { "bars": "13", "text": "Puudub paus" }
  ]
  ```

- Iga märkus: taktinumber/-vahemik + kirjeldus
- Mitu märkust sama lahtris (eri taktid → eraldi read tabelis)

### US-04: Tagasiside sisestamine (kogu noodi parameetrid)

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

### US-05: Reaalajas ülevaade

- Päises: vigade arv, ettepanekute arv, kontrollitud lahtrite arv
- Värvikoodid: roheline=õige, punane=viga, kollane=ettepanek, hall=ei kohaldu
- Filtrid: ainult vead / ainult ettepanekud / kõik

### US-06: Mitme noodi haldus

- Dashboard kuvab kõik noodid staatusega
- "Minu noodid" vaade: noodid, kus kasutaja on graafik või korrektor
- Noodi saab avada, jätkata
- Projekti kontekst (nt "Lihula laulupäev 2026") koondab seotud noodid

### US-07: Autosave

- Iga muudatus salvestatakse automaatselt (debounce 1s)
- Midagi ei lähe kaduma, "salvesta" nuppu pole vaja

### US-08: Sisselogimine (Google Auth via Cloudflare Access)

- Kasutaja logib sisse Google kontoga (ühe klõpsuga)
- Äpp tuvastab emaili ja nime Cf-Access JWT-st
- Esimesel sisselogimisel luuakse kasutajaprofiil automaatselt
- Globaalset rolli ei ole — roll tuleneb noodi kontekstist

---

## Noodi elutsükkel (pieces.status)

```text
teos → lähtefail → küljenduses → korrektuuris → kontrollitud → paranduses → kinnitatud → publitseeritud
                                      ↑                                   |
                                      └───────────────────────────────────┘
                                                      (uuesti korrektuuris)
```

| Staatus        | Tähendus                              | Kes muudab       | Dashboard värv         |
| -------------- | ------------------------------------- | ---------------- | ---------------------- |
| teos           | Laul on kavas, materjali pole veel    | Wrangler (admin) | `#ADB5BD` hall         |
| lähtefail      | Allikas/originaal olemas              | Wrangler (admin) | `#ADB5BD` hall         |
| küljenduses    | Graafik küljendab                     | typesetter       | `#E9C46A` kollane      |
| korrektuuris   | Korrektor kontrollib                  | typesetter       | `#E9C46A` kollane      |
| kontrollitud   | Tagasiside olemas, ootab graafikut    | automaatne       | `#E76F51` oranž        |
| paranduses     | Graafik viib parandused sisse         | typesetter       | `#E76F51` oranž        |
| kinnitatud     | Korrektor on lõppversiooni kinnitanud | reviewer         | `#52B788` roheline     |
| publitseeritud | Lõplik fail lingiga jagatud           | typesetter       | `#2D6A4F` tumeroheline |

**State transition reeglid:**

1. **"küljenduses" → "korrektuuris"** — graafik määrab korrektori (US-02) ja salvestab viite noodi revisionile (PDF link), staatus muutub automaatselt
2. **"korrektuuris" → "kontrollitud"** — automaatne: review.status → `completed` triggerib muutuse
3. **"kontrollitud" → "paranduses"** — graafik alustab paranduste sisseviimist
4. **"kontrollitud" → "kinnitatud"** — otsetee kui 0 viga (graafik märgib, pole midagi parandada)
5. **"paranduses" → "kinnitatud"** — korrektor kinnitab parandused
6. **"paranduses" → "korrektuuris"** — korrektor saadab tagasi uude ringi
7. **"kinnitatud" → "publitseeritud"** — graafik märgib lõpetatuks (viimane `reviews.pdf_url` ongi lõplik versioon)
8. **Uus korrektuuriring** loob uue `reviews` kirje (eelmine säilib ajaloona)

**Õiguste kontroll:**

| Tegevus                       | Kes saab              | Kontroll                         |
| ----------------------------- | --------------------- | -------------------------------- |
| Noodi graafikuks valimine     | Iga sisselogitud      | `pieces.typesetter_id IS NULL`   |
| Korrektori määramine          | Selle noodi graafik   | `pieces.typesetter_id = user.id` |
| Review alustamine             | Selle noodi korrektor | `pieces.reviewer_id = user.id`   |
| Tagasiside sisestamine        | Review omanik         | `reviews.reviewer = user.id`     |
| Kinnitamine / tagasilükkamine | Selle noodi korrektor | `pieces.reviewer_id = user.id`   |
| Paranduste alustamine         | Selle noodi graafik   | `pieces.typesetter_id = user.id` |
| Publitseerimine               | Selle noodi graafik   | `pieces.typesetter_id = user.id` |

---

## Andmemudel (D1 / SQLite)

7 tabelit. Noodid ja parameetrimallid luuakse Wrangler CLI kaudu.

```sql
-- 1. Kasutajad (Google Auth, automaatselt loodud esimesel sisselogimisel)
CREATE TABLE users (
  id         TEXT PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,
  name       TEXT,
  picture    TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- 2. Noodipalad (luuakse Wrangler CLI kaudu)
CREATE TABLE pieces (
  id             TEXT PRIMARY KEY,
  title          TEXT NOT NULL,
  composer       TEXT,
  origin         TEXT,
  section        TEXT,
  status         TEXT DEFAULT 'teos',
  pdf_url        TEXT,              -- viimane PDF versioon (Google Drive URL)
  notes          TEXT,
  typesetter_id  TEXT REFERENCES users(id),
  reviewer_id    TEXT REFERENCES users(id),
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);

-- 3. Häälerühmad (konfigureeritav per noot)
CREATE TABLE voice_parts (
  id         TEXT PRIMARY KEY,
  piece_id   TEXT NOT NULL REFERENCES pieces(id),
  name       TEXT NOT NULL,
  sort_order INTEGER DEFAULT 0
);

-- 4. Parameetrite mallid (luuakse Wrangler CLI kaudu)
CREATE TABLE param_templates (
  id         TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  scope      TEXT NOT NULL DEFAULT 'per_voice',
  sort_order INTEGER DEFAULT 0,
  is_default INTEGER DEFAULT 1
);

-- 5. Noodi-spetsiifilised parameetrid
CREATE TABLE piece_params (
  id          TEXT PRIMARY KEY,
  piece_id    TEXT NOT NULL REFERENCES pieces(id),
  template_id TEXT NOT NULL REFERENCES param_templates(id),
  sort_order  INTEGER DEFAULT 0,
  is_active   INTEGER DEFAULT 1
);

-- 6. Ülelugemise sessioonid
CREATE TABLE reviews (
  id          TEXT PRIMARY KEY,
  piece_id    TEXT NOT NULL REFERENCES pieces(id),
  reviewer    TEXT NOT NULL REFERENCES users(id),
  status      TEXT DEFAULT 'in_progress',
  pdf_url     TEXT NOT NULL,     -- selle review'ga seotud PDF versioon
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);

-- 7. Üksikud hinnangud
CREATE TABLE review_entries (
  id            TEXT PRIMARY KEY,
  review_id     TEXT NOT NULL REFERENCES reviews(id),
  param_id      TEXT NOT NULL REFERENCES piece_params(id),
  voice_part_id TEXT REFERENCES voice_parts(id),
  verdict       TEXT NOT NULL,
  remarks       TEXT,            -- JSON: [{"bars":"5-8","text":"..."}]
  created_at    TEXT DEFAULT (datetime('now'))
);
```

**verdict väärtused:** `ok` | `error` | `suggestion` | `na`

**reviews.status väärtused:** `in_progress` | `completed`

**pieces.status väärtused:** `teos` | `lähtefail` | `küljenduses` | `korrektuuris` | `kontrollitud` | `paranduses` | `kinnitatud` | `publitseeritud`

---

## API endpointid

```text
-- Kasutaja (Cloudflare Access haldab auth'i)
GET  /api/me                          — praeguse kasutaja andmed (JWT + D1)
GET  /api/users                       — kasutajate nimekiri (korrektori valimise dropdown, auth nõutav)

-- Noodid
GET  /api/pieces                      — nootide nimekiri (dashboard)
GET  /api/pieces/[id]                 — noot koos häälerühmade ja parameetritega
PUT  /api/pieces/[id]/claim           — graafikuks hakkamine (US-01)
PUT  /api/pieces/[id]/assign-reviewer — korrektori määramine (US-02)
PUT  /api/pieces/[id]/status          — staatuse muutmine (õiguste kontroll)

-- Ülelugemised
POST /api/reviews                     — uus ülelugemine
GET  /api/reviews/[id]                — ülelugemine koos entry'dega
PUT  /api/reviews/[id]                — uuenda staatust (completed)
PUT  /api/reviews/[id]/entries        — bulk upsert (autosave)

-- Kõik GET endpointid on avalikud (read-only ilma auth'ita), v.a GET /api/users (auth nõutav)
-- POST/PUT endpointid nõuavad auth'i + noodi-põhist rolli
```

---

## Svelte 5 komponentide hierarhia

```text
routes/
├── +layout.svelte               — auth guard, kasutaja kontekst
├── +layout.server.ts            — Cf-Access JWT valideerimine
├── +page.svelte                 — Dashboard
├── pieces/[id]/
│   └── +page.svelte             — Noodi süvavaade (split-view)
└── api/
    ├── me/
    ├── users/
    ├── pieces/
    └── reviews/

lib/components/
├── PdfViewer.svelte             — Google Drive PDF embed
├── ReviewForm.svelte            — tagasiside vorm
├── VoiceParamGrid.svelte        — maatriks (per-voice)
├── WholeParamRow.svelte         — rida (kogu noodi)
├── VerdictRadio.svelte          — ok/viga/ettepanek/na
├── ProgressBar.svelte           — dashboardi progressiriba
├── PieceCard.svelte             — noodi kaart nimekirjas
└── AssignReviewer.svelte        — kasutajate dropdown korrektori valimiseks

lib/server/
└── db.ts                        — D1 ühendus
```

---

## Mittefunktsionaalsed nõuded

| Nõue            | Kirjeldus                                                  |
| --------------- | ---------------------------------------------------------- |
| Mobiilisõbralik | Tahvelarvutil kasutatav (korrektor töötab noodiga kõrvuti) |
| Eesti keel      | Kogu UI eestikeelne (v1)                                   |
| Jõudlus         | 30+ parameetrit × 4 häälerühma tabel peab olema sujuv      |
| PDF             | Google Drive'i link / embed                                |
| Autosave        | Debounce 1s, midagi ei lähe kaduma                         |

---

## Admin-töö (Wrangler CLI)

Äpis admin-vaadet pole. Järgmised toimingud tehakse Wrangler CLI kaudu otse D1-sse:

- Nootide loomine (`INSERT INTO pieces`)
- Parameetrimallide haldamine — lisamine, täiendamine, ümber järjestamine (`param_templates.sort_order`)
- Häälerühmade seadistamine (`INSERT INTO voice_parts`)
- Noodi-parameetrite aktiveerimine (`INSERT INTO piece_params`)
- Algstaatuste muutmine (`teos` → `lähtefail`)

Wrangler kirjutab otse D1-sse → äpp loeb sama D1 → muudatused on kohe nähtavad.

---

## v2 (tulevikus)

- Eksport CSV/XLSX (SheetJS)
- PDF versiooniajalugu
- Teavitused (staatus muutub → e-mail)
- Mitme korrektori koostöö
- Versiooniajalugu (kes, millal, mida muutis)
- Rolli haldamise UI
- Korrektuuriringi number dashboardis
- Noodi `needs_attention` flag (prototüübi "Küsimus" staatus)
- R2 failihoidla PDF-ide jaoks (praegu Google Drive)

---

## Viited

- Liisa tagasiside näidis: `Lihula laulupäev/docs/Nootide kontrollimine.xlsx - Millal saame sinna maale.csv`
- Dashboardi prototüüp: `Lihula laulupäev/lihula-dashboard.jsx`
- Programm ja staatused: `Lihula laulupäev/KAVA-JA-NOODID.md`
- Registreerimisvormi info: `Lihula laulupäev/docs/registreerimisvorm.md`
