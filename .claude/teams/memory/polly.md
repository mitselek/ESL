# Polly märkmed

## Kehtiv seisu kokkuvõte (2026-02-26)

[OTSUS] 2026-02-26 — v1 scope'i viimane seis:
- Google Auth (Cloudflare Access + Google IDP)
- Eksport (CSV/XLSX) v2-s
- Rollid on NOODI-PÕHISED (typesetter/reviewer per noot), mitte globaalsed. `users.role` KAOTATUD.
- Admin-töö (noodid, parameetrimallid, kasutajad) Wrangler CLI kaudu, äpis admin-vaadet pole
- Kogu äpp avalikult loetav (read-only). Auth ainult kirjutamiseks.
- share_token KAOTATUD — jagamine on lihtsalt URL kopeerimine

[OTSUS] 2026-02-26 — Elutsükkel (pooleli, 8 staatust + loop):
teos → lähtefail → küljendus → korrektuur → ootab_parandust → parandatud → kinnitus → publitseeritud
Loop: kinnitus → tagasi korrektuur. Iga ring = uus reviews kirje.
NB: "ootab_parandust" on uus staatus (minu soovitus, ootab kinnitust) — täidab lünga korrektuur ja parandatud vahel.

[OTSUS] 2026-02-26 — Kasutajalood (viimane seis, US-d ümber nummerdatud):
- US-01: Graafikuks hakkamine (claim)
- US-02: Korrektori määramine (assign-reviewer)
- US-03: Per-voice tagasiside (16 parameetrit)
- US-04: Kogu noodi tagasiside (7 parameetrit)
- US-05: Reaalajas ülevaade
- US-06: Mitme noodi haldus ("minu noodid")
- US-07: Autosave (debounce 1s)
- US-08: Sisselogimine (Google Auth, Cf Access) — globaalset rolli pole
- Jagatud lingid (vana US-07/US-08) KAOTATUD — avalik read-only asendab

## Andmemudel

[OTSUS] 2026-02-26 — 7 tabelit: users, pieces, voice_parts, param_templates, piece_params, reviews, review_entries
- pieces: typesetter_id + reviewer_id (FK users), mitte created_by
- reviews: share_token KAOTATUD (ootab eemaldamist REQUIREMENTS.md-st)
- review_entries.remarks: JSON [{"bars":"5-8","text":"..."}]
- reviews.status: in_progress | completed

## Pooleliolevad teemad

[POOLELI] 2026-02-26 — REQUIREMENTS.md-s share_token jäänukid: US-08 rida 168-172, reviews.share_token rida 285, /r/[share_token] rida 330-331, r/[token] route rida 345-346. Kõik tuleb eemaldada.

[POOLELI] 2026-02-26 — "ootab_parandust" staatus ootab kasutaja kinnitust. Kui kinnitatakse, siis 8 staatust + loop. Soovitasin värve: ootab_parandust=#E76F51 oranž, parandatud=#457B9D sinine.

## Mustrid

[MUSTER] 2026-02-26 — CSV struktuur: rida=parameeter, veerg=häälerühm (S/A/T/B). Tulemused: "õige", "Ettepanek: ...", "Viga: ...", tühi=ei kohaldu (-).

[MUSTER] 2026-02-26 — Parameetrid kahes scope'is:
1. Per-voice (16 tk): noodikõrgused, pausid, rütmid, sõnad, strihhid jne
2. Kogu noodi (7 tk): pealkiri, helilooja, tempo jne
