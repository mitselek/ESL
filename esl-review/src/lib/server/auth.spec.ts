/**
 * Auth handler test — TDD red phase
 *
 * Testib getUser() funktsiooni otse.
 * JWT mock: base64-kodeeritud payload (ei pea olema allkirjastatud).
 * D1Database mock: wrapper node:sqlite DatabaseSync ümber.
 *
 * Praegu KUKUB LÄBI — src/lib/server/auth.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { getUser } from './auth.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../..', 'migrations');

// Lihtne D1Database mock — wrapper node:sqlite ümber
function makeD1Mock(db: DatabaseSync) {
	return {
		prepare: (sql: string) => ({
			bind: (...args: unknown[]) => ({
				first: async () => {
					const stmt = db.prepare(sql);
					const params = args as Parameters<typeof stmt.get>;
					return stmt.get(...params) ?? null;
				},
				run: async () => {
					const stmt = db.prepare(sql);
					stmt.run(...(args as Parameters<typeof stmt.run>));
					return { success: true };
				},
				all: async () => {
					const stmt = db.prepare(sql);
					return { results: stmt.all(...(args as Parameters<typeof stmt.all>)) };
				}
			})
		})
	};
}

// Base64url-kodeeritud mock JWT (header.payload.signature formaadis)
function makeMockJwt(payload: Record<string, unknown>): string {
	const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
	const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
	return `${header}.${body}.mock-signature`;
}

function openDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	return db;
}

describe('getUser — auth', () => {
	let db: DatabaseSync;
	let d1: ReturnType<typeof makeD1Mock>;

	beforeEach(() => {
		db = openDb();
		d1 = makeD1Mock(db);
	});

	it('null header → tagastab null', async () => {
		const result = await getUser(d1 as never, null);
		expect(result).toBeNull();
	});

	it('tühi string → tagastab null', async () => {
		const result = await getUser(d1 as never, '');
		expect(result).toBeNull();
	});

	it('vigane JWT (ei ole 3-osaline) → tagastab null', async () => {
		const result = await getUser(d1 as never, 'mitte-jwt');
		expect(result).toBeNull();
	});

	it('kehtiv JWT → tagastab kasutaja objekti {id, email, name, picture}', async () => {
		const jwt = makeMockJwt({ email: 'test@example.com', name: 'Test User', picture: 'https://example.com/pic.jpg' });
		const result = await getUser(d1 as never, jwt);
		expect(result).not.toBeNull();
		expect(result).toHaveProperty('id');
		expect(result).toHaveProperty('email', 'test@example.com');
		expect(result).toHaveProperty('name', 'Test User');
		expect(result).toHaveProperty('picture', 'https://example.com/pic.jpg');
	});

	it('esimesel sisselogimisel luuakse kasutaja D1-sse', async () => {
		const jwt = makeMockJwt({ email: 'new@example.com', name: 'New User', picture: null });
		await getUser(d1 as never, jwt);
		const row = db.prepare("SELECT * FROM users WHERE email='new@example.com'").get() as { email: string } | undefined;
		expect(row).toBeTruthy();
		expect(row?.email).toBe('new@example.com');
	});

	it('teisel sisselogimisel sama kasutaja — ei teki duplikaati', async () => {
		const jwt = makeMockJwt({ email: 'repeat@example.com', name: 'Repeat User', picture: null });
		await getUser(d1 as never, jwt);
		await getUser(d1 as never, jwt);
		const row = db.prepare("SELECT COUNT(*) as count FROM users WHERE email='repeat@example.com'").get() as { count: number };
		expect(row.count).toBe(1);
	});

	it('JWT ilma nimeta — name on null, kasutaja luuakse', async () => {
		const jwt = makeMockJwt({ email: 'noname@example.com' });
		const result = await getUser(d1 as never, jwt);
		expect(result).not.toBeNull();
		expect(result?.email).toBe('noname@example.com');
		expect(result?.name === null || result?.name === undefined || typeof result?.name === 'string').toBe(true);
	});

	it('JWT ilma emailita → tagastab null', async () => {
		const jwt = makeMockJwt({ name: 'No Email User' });
		const result = await getUser(d1 as never, jwt);
		expect(result).toBeNull();
	});
});
