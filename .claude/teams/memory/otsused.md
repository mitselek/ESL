# Kehtivad otsused

Siia kirjutatakse olulised otsused koos põhjenduste ja kuupäevadega.
Iga meeskonnaliige võib lisada; team-lead hooldab (kustutab aegunud kirjeid).

Formaat: `[OTSUS] YYYY-MM-DD — Otsus. Põhjendus.`

---

## Nootide ülelugemise äpp (v1 scope)

[OTSUS] 2026-02-26 — v1-s ei ole mitme korrektori koostööd. Üks korrektor, üks noot korraga. Lihtsustab arhitektuuri oluliselt.

[OTSUS] 2026-02-26 — v1-s ei ole versiooniajalugu. Piisab viimasest seisust. Saab hiljem lisada.

[OTSUS] 2026-02-26 — ~~Autentimine jäetakse v1-st välja~~ TÜHISTATUD. Google Auth tuleb v1-sse Cloudflare Access'i kaudu. Jagatud lingid jäävad read-only juurdepääsuks ilma auth'ita.

[OTSUS] 2026-02-26 — Häälerühmad on konfigureeritavad noodi tasandil (S/A/T/B ja kombinatsioonid: SSA, SSAATTBB jne).

[OTSUS] 2026-02-26 — Parameetrite järjekord: Liisa CSV järjekord on vaikeväärtus, kohandatavus on olulisem. Parameetrid on noodi tasandil aktiveeritavad/deaktiveeritavad ja ümber järjestatavad.

[OTSUS] 2026-02-26 — Äpp elab ESL repo alamkaustas `esl-review/`. Kasutaja otsus — hoiab kõik ühes kohas. Cloudflare Pages deployment seadistatakse alamkaustale.

[OTSUS] 2026-02-26 — Dashboard vaade on vajalik: nootide nimekiri staatustega (kontrollitud / pooleli / ootab). See on põhivaade.

[OTSUS] 2026-02-26 — ORM valik (Drizzle vs raw SQL) jääb implementeerija otsustada. Mõlemad on aktsepteeritavad.

[OTSUS] 2026-02-26 — ~~`users` tabelit v1-s EI OLE~~ TÜHISTATUD. `users` tabel on tagasi (Google Auth). 7 tabelit kokku.

[OTSUS] 2026-02-26 — Noodi elutsükkel on 7-astmeline + loop: teos → lähtefail → küljendus → korrektuur → parandatud → kinnitus → publitseeritud. Kinnitus saab minna tagasi korrektuuriks. Iga korrektuuriring loob uue `reviews` kirje. PDF versioonid ja teavitused jäävad v2-sse.

[OTSUS] 2026-02-26 — Äpp on üks, kaks põhivaadet: (1) Dashboard — nootide nimekiri + progressiriba + staatused; (2) Noodi süvavaade — PDF + tagasiside vorm. Üks andmemudel, üks deployment.

[OTSUS] 2026-02-26 — Ülelugemise lõpetamine (review.status → completed) uuendab noodi staatuse automaatselt: "korrektuur" → "parandatud".

[OTSUS] 2026-02-26 — Kirjavahetuse ajajoon ja kirjamustandid (prototüübi 1. ja 3. vaade) on v1-st VÄLJAS. Prototüübist võetakse ainult "Laulude seis" vaade dashboardi aluseks.

[OTSUS] 2026-02-26 — Cloudflare Access + Google IDP autentimiseks. Zero auth koodi — Cloudflare haldab OAuth voogu. Free tier (50 kasutajat). Arvo soovitus.

[OTSUS] 2026-02-26 — Eksport (CSV/XLSX) läheb v2-sse. v1-s pole prioriteet.

[OTSUS] 2026-02-26 — State transition reeglid: (1) korrektor otsustab kinnitus vs tagasi korrektuur; (2) graafik märgib küljendus→korrektuur käsitsi; (3) uus korrektuuriring = uus reviews kirje.
