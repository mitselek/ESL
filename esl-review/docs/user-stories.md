# User Stories

## State machine

```text
teos → lähtefail → küljenduses → korrektuuris → kontrollitud → kinnitatud → publitseeritud
                                       ↑                ↓
                                       └── paranduses ──┘
```

| Üleminek                           | Kes       | Kuidas                              |
| ---------------------------------- | --------- | ----------------------------------- |
| `teos` → `lähtefail`               | igaüks    | lähtefaili üleslaadimine            |
| `teos`/`lähtefail` → `küljenduses` | igaüks    | "Võta küljendada"                   |
| `küljenduses` → `korrektuuris`     | graafik   | korrektori määramine + draft PDF    |
| `korrektuuris` → `kontrollitud`    | korrektor | ülelugemise lõpetamine              |
| `kontrollitud` → `paranduses`      | graafik   | "Parandan"                          |
| `kontrollitud` → `kinnitatud`      | graafik   | "Kinnita" (keelatud kui on vigasid) |
| `paranduses` → `korrektuuris`      | graafik   | parandatud PDF üleslaadimine        |
| `paranduses` → `korrektuuris`      | korrektor | "Tagasi korrektuuris"               |
| `paranduses` → `kinnitatud`        | korrektor | "Kinnita"                           |
| `kinnitatud` → `publitseeritud`    | graafik   | "Publitseeri"                       |

## Sisukord

- [User Stories](#user-stories)
  - [State machine](#state-machine)
  - [Sisukord](#sisukord)
  - [Teos](#teos)
  - [Lähtefail](#lähtefail)
  - [Küljenduses](#küljenduses)
  - [Korrektuuris](#korrektuuris)
    - [Korrektor: redaktsioonide vahel vahetamine split-view's](#korrektor-redaktsioonide-vahel-vahetamine-split-views)
    - [Korrektor: redaktsiooniga seotud märkused](#korrektor-redaktsiooniga-seotud-märkused)
  - [Kontrollitud](#kontrollitud)
    - [Graafik: korrektori märkusi pole — kinnitan noodi](#graafik-korrektori-märkusi-pole--kinnitan-noodi)
    - [Graafik: korrektori märkused olemas — vaatan üle ja parandan](#graafik-korrektori-märkused-olemas--vaatan-üle-ja-parandan)
  - [Paranduses](#paranduses)
    - [Graafik: uue redaktsiooni üleslaadimine](#graafik-uue-redaktsiooni-üleslaadimine)
    - [Korrektor: readonly split-view koos ettepanekutega](#korrektor-readonly-split-view-koos-ettepanekutega)
  - [Kinnitatud](#kinnitatud)
    - [Graafik: publitseeri viimase redaktsiooniga](#graafik-publitseeri-viimase-redaktsiooniga)
    - [Graafik: publitseeri uue failiga](#graafik-publitseeri-uue-failiga)
  - [Publitseeritud](#publitseeritud)

---

## Teos

_Algstaatus. Noot on nimekirjas, aga tööd pole alustatud._

## Lähtefail

_Algnoot (source PDF) on üles laetud._

## Küljenduses

_Graafik on noodi endale võtnud ja töötab küljendusega._

### Graafik: häälerühmade/instrumentide haldamine

**Kes:** graafik
**Millal:** noot on `küljenduses` staatuses
**Tahan:** lisada ja eemaldada häälerühmi/instrumente, et korrektor saaks hiljem iga häälerühma kohta eraldi verdikti anda
**Tulemus:** häälerühmad salvestuvad kohe (ilma lehe taaslaadimiseta), fookus jääb sisestusväljale

## Korrektuuris

_Graafik on draft PDF üles laadinud ja korrektor loeb üle._

### Korrektor: redaktsioonide vahel vahetamine split-view's

**Kes:** korrektor
**Millal:** noot on `korrektuuris` staatuses, on mitu redaktsiooni
**Tahan:** split-view vasakul poolel näha vaikimisi viimast redaktsiooni, aga saama vahetada ka varasematele
**Tulemus:** saan võrrelda erinevaid versioone algnoodiga

**Tehniline:**

- Tabel `piece_redactions (id, piece_id, url, label, created_at)` — iga PDF upload lisab rea
- `reviews.redaction_id` → iga korrektuur on seotud konkreetse redaktsiooniga
- Frontend: dropdown redaktsioonide vahetamiseks + vanema redaktsiooni juures readonly märkused

### Korrektor: redaktsiooniga seotud märkused

**Kes:** korrektor
**Millal:** vahetab redaktsiooni _picker_'ist
**Tahan:** näha selle redaktsiooniga seotud korrektuurimärkusi — vanematel readonly, praegusel täidetav vorm
**Tulemus:** saan jälgida, milliseid vigu iga versioon sisaldas ja kuidas parandused on edenenud

## Kontrollitud

_Korrektor on ülelugemise lõpetanud. Graafik vaatab märkused üle._

### Graafik: korrektori märkusi pole — kinnitan noodi

**Kes:** graafik
**Millal:** noot on `kontrollitud` staatuses, korrektori ülelugemine ei sisalda vigu ega ettepanekuid
**Tahan:** näha selget signaali, et noot on korras, ja kinnitada ühe nupuvajutusega
**Tulemus:** noot läheb `kinnitatud` staatusesse

### Graafik: korrektori märkused olemas — vaatan üle ja parandan

**Kes:** graafik
**Millal:** noot on `kontrollitud` staatuses, korrektori ülelugemine sisaldab vigu ja/või ettepanekuid
**Tahan:** näha korrektori märkuste kokkuvõtet ja otsustada: parandan (→ `paranduses`) või kinnitan vaatamata (→ `kinnitatud`, keelatud kui vigu)
**Tulemus:** kas lähen parandama (staatus `paranduses`) või kinnitan (staatus `kinnitatud`)

## Paranduses

_Graafik parandab korrektori poolt leitud vigu._

### Graafik: uue redaktsiooni üleslaadimine

**Kes:** graafik
**Tahan:** laadida üles parandatud PDF, et sisseviidud parandused salvestada
**Tulemus:** `pdf_url` uueneb, staatus läheb `korrektuuris`

### Korrektor: readonly split-view koos ettepanekutega

**Kes:** korrektor
**Tahan:** näha readonly split-view vaadet (küljendus vs algnoot) koos oma eelmise ülelugemise märkustega
**Tulemus:** saan jälgida, kas graafik on mu märkused arvesse võtnud

## Kinnitatud

_Noot on heaks kiidetud. Ootab avaldamist._

### Graafik: publitseeri viimase redaktsiooniga

**Kes:** graafik
**Millal:** noot on `kinnitatud` staatuses
**Tahan:** avaldada noodi viimase korrektuurist tulnud redaktsiooniga ilma uut faili laadimata
**Tulemus:** noot läheb `publitseeritud` staatusesse, pdf_url jääb samaks

### Graafik: publitseeri uue failiga

**Kes:** graafik
**Millal:** noot on `kinnitatud` staatuses, viimane redaktsioon vajab trükieelset viimistlust
**Tahan:** laadida üles publitseerimiseks mõeldud PDF ja avaldada sellega
**Tulemus:** uus redaktsioon salvestatakse, noot läheb `publitseeritud` staatusesse

## Publitseeritud

_Noot on avaldatud._
