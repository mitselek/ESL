/**
 * PUT /api/pieces/[id]/claim handler test — TDD red phase
 *
 * Testib claimPiece() funktsiooni otse node:sqlite DatabaseSync-iga.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/claim.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { claimPiece } from './claim.js';
import type { User } from '../auth.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const TEST_USER: User = {
	id: 'user-claim-test',
	email: 'claimer@example.com',
	name: 'Claimer',
	picture: null
};

const OTHER_USER: User = {
	id: 'user-other',
	email: 'other@example.com',
	name: 'Other',
	picture: null
};

function openSeededDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, 'seed.sql'), 'utf-8'));
	// Lisa testkasutajad
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		TEST_USER.id, TEST_USER.email, TEST_USER.name, TEST_USER.picture
	);
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		OTHER_USER.id, OTHER_USER.email, OTHER_USER.name, OTHER_USER.picture
	);
	return db;
}

function getFreePieceId(db: DatabaseSync, status = 'teos'): string {
	const row = db
		.prepare('SELECT id FROM pieces WHERE typesetter_id IS NULL AND status = ? LIMIT 1')
		.get(status) as { id: string } | undefined;
	if (!row) throw new Error(`Seed andmestikus pole ühtegi vaba noodid staatusega "${status}"`);
	return row.id;
}

function getClaimedPieceId(db: DatabaseSync): string {
	// Claim üks teos-staatusega noot OTHER_USER-ile, et saada juba võetud noot
	const freeId = getFreePieceId(db);
	db.prepare("UPDATE pieces SET typesetter_id = ?, status = 'küljenduses' WHERE id = ?").run(OTHER_USER.id, freeId);
	return freeId;
}

describe('PUT /api/pieces/[id]/claim', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openSeededDb();
	});

	it('olematu noot → {error, status: 404}', () => {
		const result = claimPiece(db, 'olematu-id', TEST_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(404);
	});

	it('noodil on juba typesetter → {error: "Already claimed", status: 409}', () => {
		const claimedId = getClaimedPieceId(db);
		const result = claimPiece(db, claimedId, TEST_USER);
		expect(result).toHaveProperty('error', 'Already claimed');
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('vaba noot → {ok: true}', () => {
		const freeId = getFreePieceId(db);
		const result = claimPiece(db, freeId, TEST_USER);
		expect(result).toEqual({ ok: true });
	});

	it('pärast claimi on typesetter_id korrektselt DB-s', () => {
		const freeId = getFreePieceId(db);
		claimPiece(db, freeId, TEST_USER);
		const row = db
			.prepare('SELECT typesetter_id FROM pieces WHERE id = ?')
			.get(freeId) as { typesetter_id: string };
		expect(row.typesetter_id).toBe(TEST_USER.id);
	});

	it('sama kasutaja ei saa noodid kaks korda claimida → 409', () => {
		const freeId = getFreePieceId(db);
		claimPiece(db, freeId, TEST_USER);
		const result = claimPiece(db, freeId, TEST_USER);
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('teos staatusega piece + claim → ok: true, DB-s status = küljenduses', () => {
		const freeId = getFreePieceId(db);
		// seed data has status = 'teos' and typesetter_id IS NULL
		const result = claimPiece(db, freeId, TEST_USER);
		expect(result).toEqual({ ok: true });
		const row = db
			.prepare('SELECT status, typesetter_id FROM pieces WHERE id = ?')
			.get(freeId) as { status: string; typesetter_id: string };
		expect(row.status).toBe('küljenduses');
		expect(row.typesetter_id).toBe(TEST_USER.id);
	});

	it('lähtefail staatusega piece + claim → ok: true, status = küljenduses', () => {
		const freeId = getFreePieceId(db);
		db.prepare("UPDATE pieces SET status = 'lähtefail' WHERE id = ?").run(freeId);
		const result = claimPiece(db, freeId, TEST_USER);
		expect(result).toEqual({ ok: true });
		const row = db
			.prepare('SELECT status, typesetter_id FROM pieces WHERE id = ?')
			.get(freeId) as { status: string; typesetter_id: string };
		expect(row.status).toBe('küljenduses');
		expect(row.typesetter_id).toBe(TEST_USER.id);
	});

	it('küljenduses staatusega piece + claim → 409', () => {
		const freeId = getFreePieceId(db);
		db.prepare("UPDATE pieces SET status = 'küljenduses' WHERE id = ?").run(freeId);
		const result = claimPiece(db, freeId, TEST_USER);
		expect(result).toHaveProperty('error', 'Cannot claim in current status');
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('korrektuuris staatusega piece + claim → 409', () => {
		const freeId = getFreePieceId(db);
		db.prepare("UPDATE pieces SET status = 'korrektuuris' WHERE id = ?").run(freeId);
		const result = claimPiece(db, freeId, TEST_USER);
		expect(result).toHaveProperty('error', 'Cannot claim in current status');
		expect((result as { error: string; status: number }).status).toBe(409);
	});
});
