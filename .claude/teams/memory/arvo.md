# Arvo — Arhitektuuriülevaatuse märkmed

## [VAHEKOKKUVÕTE] 2026-02-26

### Nootide ülelugemise äpp — arhitektuur esitatud

Analüüsisin Liisa CSV tagasisideformaati (`Lihula laulupäev/docs/Nootide kontrollimine.xlsx - Millal saame sinna maale.csv`).

**Peamised avastused CSV-st:**
- [MUSTER] CSV-l on kaks selget sektsiooni: per-voice parameetrid (S/A/T/B tulbad) ja whole-piece parameetrid (üks tulp "Kogu noodi kohta")
- [MUSTER] Verdict väärtused: "õige"/"olemas" = ok, "Ettepanek: ..." = suggestion, "Vead: ..." = error, "-" = n/a
- [MUSTER] Kommentaarid on pikad vabatekstiväljad koos konkreetsete taktiviidete ja selgitustega

**Arhitektuuriotsused esitatud:**
- [OTSUS] 5 tabelit: pieces, voice_parts, review_params (scope: per_voice|whole_piece), reviews, review_entries
- [OTSUS] Drizzle ORM (D1 natiivne tugi) > Prisma
- [OTSUS] pdf.js split-view (desktop) / tabs (mobiil)
- [OTSUS] Autosave debounce 1s, Svelte 5 $state rune'id
- [OTSUS] Jagatud lingid (share_token), mitte auth — 2-3 kasutajat
- [OTSUS] SheetJS eksport, staatiline PDF hosting alguses

**Team-lead'i vastused (2026-02-26):**
- [OTSUS] 2026-02-26 — Eraldi repo (mitte ESL repo alamkaust). Põhjendus: ESL on sisu-repo, äpp on tarkvara, eraldi CI/CD.
- [OTSUS] 2026-02-26 — Parameetrid peavad olema konfigureeritavad (admin-hallatavad). Põhjendus: barokmuusikas on teised parameetrid kui rahvalauludes.
- [OTSUS] 2026-02-26 — Dashboard vaade on vajalik: nootide nimekiri staatustega (kontrollitud / pooleli / ootab).
- [OTSUS] 2026-02-26 — ORM valik (Drizzle vs raw SQL) jääb Sveni otsustada implementatsiooni käigus.
- [OTSUS] 2026-02-26 — `users` tabelit v1-s ei ole (YAGNI). 6 tabelit kokku.
- [OTSUS] 2026-02-26 — 8-astmeline noodi elutsükkel `pieces.status` väljal (Noodi ettepanek). PDF versioonid ja teavitused v2.
### Dashboard prototüübi analüüs (2026-02-26)

Fail: `Lihula laulupäev/lihula-dashboard.jsx` (React prototüüp)

**UX mustrid, mis tuleb SvelteKit äppi üle kanda:**
- [MUSTER] Header: koondstatistika (küljendatud/total, kontrollitud/küljendatud, päevi tähtajani, tähtaeg)
- [MUSTER] Progressiriba: segmenteeritud (valmis=roheline, ootab=kollane, küljendamata=hall, küsimus=punane)
- [MUSTER] Laulud grupeeritud osade kaupa (I-IV), iga laul reana: StatusDot + pealkiri + helilooja + staatuse badge
- [MUSTER] 5 staatust prototüübis: Valmis (#2D6A4F), Liisa kontrollinud (#52B788), Ootan tagasisidet (#E9C46A), Küljendamata (#ADB5BD), Küsimus (#E76F51)
- [MUSTER] Visuaalne keel: Crimson Pro serif, JetBrains Mono monospace, soojad toonid (#FAF6F0 taust, #C9A96E aktsent)

**Prototüübi 5 staatust vs 8-astmeline voog — harmoniseerida implementatsioonis.**

**[POOLELI]** Ootan team-lead'i luba implementatsiooni käivitamiseks. Nõuete ja arhitektuuri koondamine käib.
