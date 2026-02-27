# Sven — SvelteKit frontend arendaja märkmed

## Kehtiv setup (2026-02-27)

### Projekti asukoht

`esl-review/` alamkaust ESL repo juurest. CF Pages build seaded:

- Root directory: `esl-review`
- Build command: `pnpm build`
- Build output: `.svelte-kit/cloudflare`

### Olulised SvelteKit + CF spetsiifikad

[MUSTER] `platform.env.DB` on saadaval ainult serveripoolses koodis (`+page.server.ts`, `+server.ts`). Klient ei näe D1-t.

[MUSTER] Auth-kontroll (`Cf-Access-Jwt-Assertion` header) käib ainult `+layout.server.ts`-is.

[MUSTER] Arendusserver: `wrangler pages dev .svelte-kit/cloudflare --local` (mitte `wrangler dev`).

### Projekti bootstrapi sammud (tegelik, töötav käsk)

```bash
# sv create töötab mitteinteraktiivselt (addone eraldi --add lipuga)
pnpm dlx sv create esl-review --template minimal --types ts --add eslint --add prettier --add playwright --no-dir-check --no-download-check --no-install
# NB: --add vitest ei tööta (nõuab interaktiivset valikut) — lisa käsitsi:
pnpm add -D vitest @vitest/ui @testing-library/svelte
pnpm add -D @sveltejs/adapter-cloudflare wrangler
pnpm add -D tailwindcss @tailwindcss/vite  # Tailwind v4 (plugin-free)
pnpm remove @sveltejs/adapter-auto
```

[MUSTER] Tailwind v4 vite.config.ts: `tailwindcss()` plugin enne `sveltekit()`.
[MUSTER] vitest.config.ts tuleb luua käsitsi — `sv add vitest` on interaktiivne.

### Dev workflow (kokkulepitud tiimiga)

- `wrangler pages dev .svelte-kit/cloudflare --local` + seed: `wrangler d1 execute DB --local --file=seed.sql`
- TODO.md (mitte GitHub Issues)
- `git push main` → auto CF Pages deploy; D1 migratsioonid käsitsi

## API mustrid (kõigis endpoint'ides järgitud)

[MUSTER] Iga API fail: `getFoo(db: DatabaseSync, ...)` (sünkroonne, testid) + `getFooD1(db: D1Db, ...)` (asünkroonne, route). D1Db on lokaalne minimaalne interface igas failis.

[MUSTER] Route standard: `platform?.env.DB ?? null` → 503 kui null. Auth nõutavatel: `locals.user` → 401 enne DB checkki.

[MUSTER] SQLite ülakomad TS stringides: kasuta template literal backtick-iga: `` `datetime('now')` `` mitte `'datetime(\'now\')'`.

[MUSTER] D1 atomaarne bulk upsert: `db.batch([deleteStmt, ...insertStmts])` — D1PreparedBound[] tüüp.

[MUSTER] node:sqlite `.all()` cast: `as unknown as T[]` (ei toeta generics).

## Valmis endpointid (107/107 testi rohelised, 2026-02-27)

- GET /api/pieces — `pieces.ts` + `getPieces`/`getPiecesD1`
- GET /api/me — `me.ts` + `getMeResponse`
- GET /api/users — `users.ts` + `getUsers`/`getUsersD1` (auth nõutav)
- GET /api/pieces/[id] — `piece.ts` + `getPiece`/`getPieceD1`
- PUT /api/pieces/[id]/claim — `claim.ts` + `claimPiece`/`claimPieceD1`
- PUT /api/pieces/[id]/assign-reviewer — `assign-reviewer.ts`
- PUT /api/pieces/[id]/status — `piece-status.ts` + TRANSITIONS tabel
- POST /api/reviews — `review-create.ts`
- GET /api/reviews/[id] — `review-get.ts`
- PUT /api/reviews/[id] — `review-complete.ts` (sama fail kui GET)
- PUT /api/reviews/[id]/entries — `review-entries.ts` + D1 batch

## Avatud küsimused

[EDASI_LÜKATUD] 2026-02-27 — `wrangler.toml` database_id on placeholder. Kasutaja peab looma D1 andmebaasi CF dashboardis ja asendama.
