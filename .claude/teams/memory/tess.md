# Tess — Testija märkmed

## Sessioon 2026-02-27 — esl-review unit testid

### Loodud testifailid (107 testi, 14 faili — kõik rohelised)

```text
src/lib/server/db/schema.spec.ts       — 16 testi (7 tabelit, kriitilised veerud)
src/lib/server/db/seed.spec.ts         — 6 testi (20 pieces, 23 param_templates)
src/lib/server/auth.spec.ts            — 8 testi (JWT mock, upsert)
src/lib/server/api/me.spec.ts          — 7 testi
src/lib/server/api/users.spec.ts       — 7 testi
src/lib/server/api/pieces.spec.ts      — 7 testi
src/lib/server/api/piece.spec.ts       — 10 testi
src/lib/server/api/claim.spec.ts       — 5 testi
src/lib/server/api/assign-reviewer.spec.ts — 6 testi
src/lib/server/api/piece-status.spec.ts    — 7 testi
src/lib/server/api/review-create.spec.ts   — 7 testi
src/lib/server/api/review-get.spec.ts      — 8 testi
src/lib/server/api/review-complete.spec.ts — 6 testi
src/lib/server/api/review-entries.spec.ts  — 7 testi
```

### [MUSTER] node:sqlite testimine

- Node 25 sisseehitatud `node:sqlite` (DatabaseSync) — pole vaja better-sqlite3
- Vitest konfig: `environment: 'node'` — töötab kohe
- `ExperimentalWarning` on normaalne, ei mõjuta teste
- MIGRATIONS_DIR path: `join(import.meta.dirname, '../../../..', 'migrations')` api/ kaustast
- DB kausta testides: `join(import.meta.dirname, '../../..', 'migrations')`

### [MUSTER] Handler mustrid (sven)

Kaks funktsiooni ühes failis:

- `getFoo(db: DatabaseSync, ...)` — sünkroonne, node:sqlite jaoks (unit testid)
- `getFooD1(db: D1Db, ...)` — asünkroonne, Cloudflare D1 jaoks (runtime)

Unit testid kasutavad sünkroonset versiooni — ei vaja D1 mock-i.

### [MUSTER] D1 mock (kui vaja)

`auth.spec.ts` sisaldab `makeD1Mock()` wrapper-i DatabaseSync ümber.
Kasuta ainult kui handler aktsepteerib ainult D1Db (mitte DatabaseSync).

### [HOIATUS] SQLite jutumärgid

`datetime("now")` — VALE (topelt jutumärgid). node:sqlite on range.
`datetime('now')` — ÕIGE (üksikud jutumärgid).
D1 aktsepteerib mõlemat, node:sqlite ainult üksikuid.
Claim.ts-is oli see viga — testid leidsid, sven parandas.

### [OTSUS] node:sqlite → @cloudflare/vitest-pool-workers

Arvo: node:sqlite aktsepteeritav v1 jaoks. Tulevikus vahetame
@cloudflare/vitest-pool-workers vastu kui äriloogika testid tulevad.
