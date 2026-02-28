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

### Sisukord

- [User Stories](#user-stories)
  - [State machine](#state-machine)
    - [Sisukord](#sisukord)
  - [Teos](#teos)
  - [Lähtefail](#lähtefail)
  - [Küljenduses](#küljenduses)
  - [Korrektuuris](#korrektuuris)
  - [Kontrollitud](#kontrollitud)
  - [Paranduses](#paranduses)
    - [Graafik: uue redaktsiooni üleslaadimine](#graafik-uue-redaktsiooni-üleslaadimine)
    - [Korrektor: readonly split-view koos ettepanekutega](#korrektor-readonly-split-view-koos-ettepanekutega)
  - [Kinnitatud](#kinnitatud)
  - [Publitseeritud](#publitseeritud)

---

## Teos

_Algstaatus. Noot on nimekirjas, aga tööd pole alustatud._

## Lähtefail

_Algnoot (source PDF) on üles laetud._

## Küljenduses

_Graafik on noodi endale võtnud ja töötab küljendusega._

## Korrektuuris

_Graafik on draft PDF üles laadinud ja korrektor loeb üle._

## Kontrollitud

_Korrektor on ülelugemise lõpetanud. Graafik vaatab märkused üle._

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

## Publitseeritud

_Noot on avaldatud._
