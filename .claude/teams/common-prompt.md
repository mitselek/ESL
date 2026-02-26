# ESL Dev — Ühised standardid

## Meeskond

- **Meeskonna nimi:** `esl-dev`
- **Liikmed:** team-lead, veeb (veebileht), noot (noodigraafika ja üritused), finn (uurimistöö), sven (SvelteKit frontend), tess (testimine), arvo (arhitektuuriülevaatus), polly (tooteomanik)

## Projekt

Eesti Segakooride Liit (ESL) — Eesti segakooride katusorganisatsioon. Repo sisaldab:

- **esl-www**: ESL-i koduleht (git submodule → aivotoots/esl)
- **Lihula laulupäev**: Lihula laulupäeva 2026 koordineerimine (23. mai 2026)
- **Haapsalu 2026**: Haapsalu suvekool 2026 planeerimisdokumendid
- **Haapsalu-Suvekool**: Barokse koorimuusika uurimistööriistad (git submodule)
- **tuljak**: XXV Tuljaku võistulaulmine

## Olulised viited

- `README.md` — projekti ülevaade, kontaktid
- `esl-www/.github/copilot-instructions.md` — veebilehe AI juhised (KOHUSTUSLIK lugeda enne esl-www tööd)
- `Haapsalu-Suvekool/.github/copilot-instructions.md` — uurimistööriistade juhised
- `Lihula laulupäev/KAVA-JA-NOODID.md` — programm ja nootide staatused
- GitHub Issues — kontrolli avatud ülesandeid konteksti saamiseks

## Kommunikatsioonireegel

Iga sõnum, mille saadad SendMessage kaudu, peab algama ajatempliga `[YYYY-MM-DD HH:MM]` formaadis. Küsi jooksev aeg käsuga: `date '+%Y-%m-%d %H:%M'` enne iga sõnumi saatmist.

## Tehnoloogiad

| Komponent | Tehnoloogia | Märkused |
|-----------|-------------|----------|
| Veebileht | Entu-SSG + Pug + YAML | Staatiline leht, kakskeelne (et/en) |
| CSS | Stylus | Kompileeritakse build'il |
| Sisu | YAML + Markdown | Sisu-andmete eraldamine (data.yaml) |
| Noodid | PDF (¡n! standard) | Ühtne küljendus Ilusa Noodi Instituudilt |
| Uurimistöö | Bash + Gemini API | bach-research.sh, bach-session.sh |
| MCP server | TypeScript + Node.js | F001-youtube-mcp-server (YouTube playlistid) |
| Ülelugemise äpp | SvelteKit 2 + Svelte 5 | Cloudflare Pages/Workers, D1, Tailwind v4 |
| Testimine | Vitest + Playwright | Ühik- ja E2E testid |
| Paketihaldur | pnpm | ALATI pnpm, mitte npm |

## Veebilehe ehitus

```bash
cd esl-www
npm run dev     # Arendusserver localhost:4000
npm run build   # Staatiline leht → build/
```

## Noodivihiku töövoog

1. **Allikas** — skaneeringud, originaalid, viited
2. **¡n! küljendus** — Ilusa Noodi Instituut teeb ühtse graafilise lahenduse
3. **Ülelugemine** — kunstiline juht (Reeda Kreen) kontrollib
4. **PDF** — valmis noot `noodivihik/` kausta
5. **Levitamine** — Google Drive'i kaudu kooridele printimiseks

### Nootide staatused

- ✅ **Olemas** — noot kinnitatud
- 📝 **Ülelugemises** — kvaliteedikontroll käib
- ❌ **Puudu** — tuleb lisada
- ⚠️ **Eriline tegevus** — nt autoriõigused
- ⏳ **Kontrollida** — staatus kinnitamata
- ❌ **Pole vaja** — välja jäetud

## Kakskeelne sisu (esl-www)

- Eesti: `data.et.yaml`, `global.et.yaml`
- Inglise: `data.en.yaml`, `global.en.yaml`
- Mallid: `self.pealkiri`, `self.sisu`, `self.asukoht` (keelest sõltumatu)
- Markdown Pugis: `self.md(field)`

## Kirjavahetuse formaat

Failinimed: `YYYY-MM-DD-HHMM-teema.md` (nt `2026-01-15-1430-reeda-noodid.md`)

## Kvaliteedikontroll

- `.markdownlint.json` — markdown formaadireegld
- Kakskeelne sisu peab olema sünkroonis
- Nootide staatused `KAVA-JA-NOODID.md`-s peavad peegeldama tegelikku seisu

## Meeskonna mälu

### Isiklikud märkmed

Iga meeskonnaliige hoiab oma märkmeid failis `.claude/teams/memory/<sinu-nimi>.md`.
Sina omanik — ainult sina kirjutad. Hoia alla 100 rea; kustuta aegunud kirjed.

### Jagatud teadmised

Ristlõikeliste avastuste jaoks lisa vastavasse jagatud faili `.claude/teams/memory/`:

- **`otsused.md`** — kehtivad otsused (formaat: otsus, põhjendus, kuupäev). Iga meeskonnaliige võib lisada; **team-lead** hooldab (kustutab, lahendab vastuolud).
- **`sisu-juhised.md`** — sisujuhised: kakskeelne sisu, nimekonventsioonid, formaat. **veeb** hooldab, kõik loevad.

### Käivitamisel lugemise nimekiri

Enne esimest tegevust:

1. Loe `.claude/teams/memory/<sinu-nimi>.md` kui see eksisteerib
2. Loe oma rollile olulised jagatud failid:
   - **Kõik rollid**: `otsused.md`
   - **veeb**: `sisu-juhised.md`
   - **noot**: `otsused.md` (ürituste otsused)
   - **sven**: `otsused.md` (äpi arhitektuur)
   - **tess**: `otsused.md` (testimise kontekst)
   - **arvo**: `otsused.md` (ülevaatuse kalibratsioon)
   - **polly**: `otsused.md` (nõuete kontekst)
   - **finn**: kõik jagatud failid (uurimise kontekst)
3. Saada tutvustussõnum `team-lead`'ile, et oled valmis

### Millal salvestada

- **Kohe avastamisel** — ära jäta sessiooni lõppu; konteksti kompakteerimine kaotab hilisemad kirjed
- **Pikkade ülesannete ajal** — tee vahekokkuvõtteid perioodiliselt (märgend: `[VAHEKOKKUVÕTE]`)
- **Enne sulgemist** — vt sulgemisprotokoll allpool

### Mida salvestada

Säilita ainult teadmisi, mis:

- Pole koodist/sisust ilmselged
- On stabiilsed (ei muutu järgmise commit'iga)
- Maksid tokeneid avastamiseks
- Säästaks värskel sinul >5 minutit taasavastamist

Kasuta märgendeid: `[OTSUS]`, `[MUSTER]`, `[POOLELI]`, `[VAHEKOKKUVÕTE]`, `[EDASI_LÜKATUD]`, `[HOIATUS]`,
või rollispetsiifilisi märgendeid. Dateeri iga sissekanne.

### Mida MITTE salvestada

- Otsinguteekonnaid ("otsisin X-i")
- Ajutisi tõrkeid, mis on juba parandatud
- Midagi, mis on juba CLAUDE.md-s, MEMORY.md-s või docs/ kaustas
- Asendatud mustandeid

### Sulgemisprotokoll

Kui saad sulgemispäringu:

1. Kui sul on pooleliolevat seisu või uusi avastusi, mida tasub hoida, kirjuta need oma märkmetesse (`[POOLELI]` või `[VAHEKOKKUVÕTE]`). Kui pole midagi salvestada, jäta see samm vahele.
2. Saada lõpusõnum team-lead'ile kuni 3 punktiga: `[ÕPPISIN]`, `[EDASI_LÜKATUD]`, `[HOIATUS]`. Jäta vahele, kui pole midagi raporteerida.
3. Tee sammud 1 ja 2 ENNE shutdown_response kutsumist. Ära kombineeri neid sulgemise kinnitamisega.
