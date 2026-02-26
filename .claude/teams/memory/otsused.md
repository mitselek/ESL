# Kehtivad otsused

Siia kirjutatakse olulised otsused koos põhjenduste ja kuupäevadega.
Iga meeskonnaliige võib lisada; team-lead hooldab (kustutab aegunud kirjeid).

Formaat: `[OTSUS] YYYY-MM-DD — Otsus. Põhjendus.`

---

## Nootide ülelugemise äpp (v1 scope)

[OTSUS] 2026-02-26 — v1-s ei ole mitme korrektori koostööd. Üks korrektor, üks noot korraga. Lihtsustab arhitektuuri oluliselt.

[OTSUS] 2026-02-26 — v1-s ei ole versiooniajalugu. Piisab viimasest seisust. Saab hiljem lisada.

[OTSUS] 2026-02-26 — Autentimine (US-07) jäetakse v1-st välja. Jagatud lingid ilma sisselogimiseta. Hoiame äpi lihtsana.

[OTSUS] 2026-02-26 — Häälerühmad on konfigureeritavad noodi tasandil (S/A/T/B ja kombinatsioonid: SSA, SSAATTBB jne).

[OTSUS] 2026-02-26 — Parameetrite järjekord: Liisa CSV järjekord on vaikeväärtus, kohandatavus on olulisem. Parameetrid on noodi tasandil aktiveeritavad/deaktiveeritavad ja ümber järjestatavad.

[OTSUS] 2026-02-26 — Äpp elab ESL repo alamkaustas `esl-review/`. Kasutaja otsus — hoiab kõik ühes kohas. Cloudflare Pages deployment seadistatakse alamkaustale.

[OTSUS] 2026-02-26 — Dashboard vaade on vajalik: nootide nimekiri staatustega (kontrollitud / pooleli / ootab). See on põhivaade.

[OTSUS] 2026-02-26 — ORM valik (Drizzle vs raw SQL) jääb implementeerija otsustada. Mõlemad on aktsepteeritavad.

[OTSUS] 2026-02-26 — `users` tabelit v1-s EI OLE. YAGNI — lisame siis, kui vaja. 6 tabelit kokku.

[OTSUS] 2026-02-26 — Noodi elutsükkel on 8-astmeline: puudu → küljenduses → ootab ülelugemist → ülelugemises → parandused esitatud → parandamisel → valmis → levitatud. See on `pieces.status`, mitte `reviews.status`. PDF versioonid ja teavitused jäävad v2-sse.

[OTSUS] 2026-02-26 — Äpp on üks, kaks põhivaadet: (1) Dashboard — nootide nimekiri + progressiriba + staatused; (2) Noodi süvavaade — PDF + tagasiside vorm + eksport. Üks andmemudel, üks deployment.

[OTSUS] 2026-02-26 — Ülelugemise lõpetamine uuendab noodi staatuse automaatselt dashboardis: "ülelugemises" → "parandused esitatud".

[OTSUS] 2026-02-26 — Kirjavahetuse ajajoon ja kirjamustandid (prototüübi 1. ja 3. vaade) on v1-st VÄLJAS. Prototüübist võetakse ainult "Laulude seis" vaade dashboardi aluseks.
