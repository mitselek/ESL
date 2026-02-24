# Claude Code meeskonnastruktuur

ESL-i (Eesti Segakooride Liit) meeskonnastruktuur Claude Code mitmeagentsete sessioonide jaoks.

## Saadaolevad meeskonnad

| Meeskond | Kirjeldus |
|----------|-----------|
| `esl-dev` | Täismeeskond (veebileht, noodigraafika, üritused, uurimistöö) |

## Seadistamine

1. Kopeeri meeskonna JSON oma Claude teams kataloogi:

   ```bash
   mkdir -p ~/.claude/teams/esl-dev
   cp .claude/teams/esl-dev.json ~/.claude/teams/esl-dev/config.json
   ```

2. Käivita sessioon meeskonnaga:

   ```bash
   claude --team esl-dev
   ```

## Meeskonnaliikmed

| Nimi | Mudel | Roll |
|------|-------|------|
| **team-lead** | Sonnet 4.6 | Ülesannete koordineerimine, projektijuhtimine |
| **veeb** | Sonnet 4.6 | esl-www veebileht: Entu-SSG, Pug, YAML, kakskeelne sisu |
| **noot** | Opus 4.6 | Noodigraafika, ürituste koordineerimine (Lihula, Tuljak) |
| **uurija** | Sonnet 4.6 | Uurimistöö koordinaator (ainult lugemine, Haapsalu-Suvekool) |

## Töövoog

1. **team-lead** jagab tööd ülesanneteks ja määrab spetsialistidele
2. **veeb** tegeleb veebilehe sisu ja tehniliste muudatustega
3. **noot** koordineerib noodivihikut ja üritusi
4. **uurija** kogub infot ja koostab markdown-raporteid
5. Kvaliteedikontroll: markdown lint, sisu korrektsus
6. Commit ainult pärast ülevaatust

## Meeskonna mälu

```
.claude/teams/memory/
├── veeb.md                  # Veebilehe mustrid, malli konventsioonid
├── noot.md                  # Noodivihiku töövoog, staatused
├── uurija.md                # Uurimisleiud
├── otsused.md               # Jagatud: kehtivad otsused
└── sisu-juhised.md          # Jagatud: sisujuhised, formaat
```

Isiklikud märkmed tekivad orgaaniliselt töö käigus. Jagatud failid on kohe olemas.
