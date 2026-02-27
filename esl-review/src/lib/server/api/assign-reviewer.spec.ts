/**
 * PUT /api/pieces/[id]/assign-reviewer handler test — TDD red phase
 *
 * Testib assignReviewer() funktsiooni otse node:sqlite DatabaseSync-iga.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/assign-reviewer.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { assignReviewer } from './assign-reviewer.js';
import type { User } from '../auth.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const TYPESETTER: User = {
	id: 'user-typesetter',
	email: 'typesetter@example.com',
	name: 'Typesetter',
	picture: null
};

const REVIEWER_USER: User = {
	id: 'user-reviewer',
	email: 'reviewer@example.com',
	name: 'Reviewer',
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
	db.exec(readFileSync(join(MIGRATIONS_DIR, 'seed.sql'), 'utf-8'));
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		TYPESETTER.id, TYPESETTER.email, TYPESETTER.name, TYPESETTER.picture
	);
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		REVIEWER_USER.id, REVIEWER_USER.email, REVIEWER_USER.name, REVIEWER_USER.picture
	);
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		OTHER_USER.id, OTHER_USER.email, OTHER_USER.name, OTHER_USER.picture
	);
	return db;
}

// Seadistab noodi: typesetter_id = TYPESETTER, status = 'küljenduses'
function setupPiece(db: DatabaseSync): string {
	const row = db.prepare('SELECT id FROM pieces LIMIT 1').get() as { id: string };
	db.prepare("UPDATE pieces SET typesetter_id = ?, status = 'küljenduses' WHERE id = ?").run(
		TYPESETTER.id, row.id
	);
	return row.id;
}

describe('PUT /api/pieces/[id]/assign-reviewer', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openSeededDb();
	});

	it('olematu noot → { error, status: 404 }', () => {
		const result = assignReviewer(db, 'olematu-id', REVIEWER_USER.id, TYPESETTER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(404);
	});

	it('kasutaja pole graafik → { error, status: 403 }', () => {
		const pieceId = setupPiece(db);
		const result = assignReviewer(db, pieceId, REVIEWER_USER.id, OTHER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(403);
	});

	it('vale staatus (mitte küljenduses) → { error, status: 409 }', () => {
		const row = db.prepare('SELECT id FROM pieces LIMIT 1').get() as { id: string };
		// typesetter_id on õige, aga staatus vale
		db.prepare("UPDATE pieces SET typesetter_id = ?, status = 'teos' WHERE id = ?").run(
			TYPESETTER.id, row.id
		);
		const result = assignReviewer(db, row.id, REVIEWER_USER.id, TYPESETTER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('reviewer_id pole kasutajate tabelis → { error, status: 400 }', () => {
		const pieceId = setupPiece(db);
		const result = assignReviewer(db, pieceId, 'olematu-kasutaja-id', TYPESETTER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(400);
	});

	it('kõik korras → { ok: true }', () => {
		const pieceId = setupPiece(db);
		const result = assignReviewer(db, pieceId, REVIEWER_USER.id, TYPESETTER);
		expect(result).toEqual({ ok: true });
	});

	it('pärast assigni: DB-s reviewer_id ja status = korrektuuris', () => {
		const pieceId = setupPiece(db);
		assignReviewer(db, pieceId, REVIEWER_USER.id, TYPESETTER);
		const row = db
			.prepare('SELECT reviewer_id, status FROM pieces WHERE id = ?')
			.get(pieceId) as { reviewer_id: string; status: string };
		expect(row.reviewer_id).toBe(REVIEWER_USER.id);
		expect(row.status).toBe('korrektuuris');
	});
});
