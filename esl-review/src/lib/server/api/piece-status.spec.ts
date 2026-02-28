/**
 * PUT /api/pieces/[id]/status handler test — TDD red phase
 *
 * Testib updatePieceStatus() funktsiooni otse node:sqlite DatabaseSync-iga.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/piece-status.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { updatePieceStatus } from './piece-status.js';
import type { User } from '../auth.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const TYPESETTER_USER: User = {
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

function openSeededDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, 'seed.sql'), 'utf-8'));
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		TYPESETTER_USER.id, TYPESETTER_USER.email, TYPESETTER_USER.name, TYPESETTER_USER.picture
	);
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		REVIEWER_USER.id, REVIEWER_USER.email, REVIEWER_USER.name, REVIEWER_USER.picture
	);
	return db;
}

function getPieceId(db: DatabaseSync): string {
	const row = db.prepare('SELECT id FROM pieces LIMIT 1').get() as { id: string };
	return row.id;
}

function setPieceState(
	db: DatabaseSync,
	pieceId: string,
	status: string,
	typeSetterId: string | null = null,
	reviewerId: string | null = null
) {
	db.prepare('UPDATE pieces SET status = ?, typesetter_id = ?, reviewer_id = ? WHERE id = ?').run(
		status, typeSetterId, reviewerId, pieceId
	);
}

describe('PUT /api/pieces/[id]/status', () => {
	let db: DatabaseSync;
	let pieceId: string;

	beforeEach(() => {
		db = openSeededDb();
		pieceId = getPieceId(db);
	});

	it('olematu noot → { error, status: 404 }', () => {
		const result = updatePieceStatus(db, 'olematu-id', 'paranduses', TYPESETTER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(404);
	});

	it('tundmatu üleminek (teos → kinnitatud) → { error, status: 409 }', () => {
		setPieceState(db, pieceId, 'teos', TYPESETTER_USER.id, REVIEWER_USER.id);
		const result = updatePieceStatus(db, pieceId, 'kinnitatud', TYPESETTER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('keelatud üleminek — typesetter proovib reviewer üleminekut (paranduses → kinnitatud) → 403', () => {
		setPieceState(db, pieceId, 'paranduses', TYPESETTER_USER.id, REVIEWER_USER.id);
		// paranduses → kinnitatud on REVIEWER töö, mitte typesetter
		const result = updatePieceStatus(db, pieceId, 'kinnitatud', TYPESETTER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(403);
	});

	it('keelatud üleminek — reviewer proovib typesetter üleminekut (kontrollitud → paranduses) → 403', () => {
		setPieceState(db, pieceId, 'kontrollitud', TYPESETTER_USER.id, REVIEWER_USER.id);
		// kontrollitud → paranduses on TYPESETTER töö, mitte reviewer
		const result = updatePieceStatus(db, pieceId, 'paranduses', REVIEWER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(403);
	});

	it('kehtiv typesetter üleminek (kontrollitud → paranduses) → { ok: true }', () => {
		setPieceState(db, pieceId, 'kontrollitud', TYPESETTER_USER.id, REVIEWER_USER.id);
		const result = updatePieceStatus(db, pieceId, 'paranduses', TYPESETTER_USER);
		expect(result).toEqual({ ok: true });
	});

	it('kehtiv reviewer üleminek (paranduses → kinnitatud) → { ok: true }', () => {
		setPieceState(db, pieceId, 'paranduses', TYPESETTER_USER.id, REVIEWER_USER.id);
		const result = updatePieceStatus(db, pieceId, 'kinnitatud', REVIEWER_USER);
		expect(result).toEqual({ ok: true });
	});

	it('DB-s staatus korrektselt uuendatud pärast üleminekut', () => {
		setPieceState(db, pieceId, 'kontrollitud', TYPESETTER_USER.id, REVIEWER_USER.id);
		updatePieceStatus(db, pieceId, 'paranduses', TYPESETTER_USER);
		const row = db
			.prepare('SELECT status FROM pieces WHERE id = ?')
			.get(pieceId) as { status: string };
		expect(row.status).toBe('paranduses');
	});

	it('typesetter saab paranduses → korrektuuris koos uue pdf_url-iga', () => {
		setPieceState(db, pieceId, 'paranduses', TYPESETTER_USER.id, REVIEWER_USER.id);
		const result = updatePieceStatus(db, pieceId, 'korrektuuris', TYPESETTER_USER, '/pdf/v2.pdf');
		expect(result).toEqual({ ok: true });
		const row = db.prepare('SELECT status, pdf_url FROM pieces WHERE id = ?').get(pieceId) as { status: string; pdf_url: string };
		expect(row.status).toBe('korrektuuris');
		expect(row.pdf_url).toBe('/pdf/v2.pdf');
	});

	it('lisab redaktsiooni kui pdf_url on antud (paranduses→korrektuuris)', () => {
		// setup: piece paranduses staatuses, olemasolev v1 redaction
		setPieceState(db, pieceId, 'paranduses', TYPESETTER_USER.id, REVIEWER_USER.id);
		db.prepare('INSERT INTO piece_redactions (id, piece_id, url, label) VALUES (?, ?, ?, ?)').run(
			'redaction-v1', pieceId, '/pdf/old.pdf', 'v1'
		);

		// paranduses → korrektuuris with new pdf_url
		const result = updatePieceStatus(db, pieceId, 'korrektuuris', TYPESETTER_USER, '/pdf/new.pdf');
		expect(result).toEqual({ ok: true });

		// verify: 2 redaction rows, latest label is 'v2'
		const rows = db
			.prepare('SELECT * FROM piece_redactions WHERE piece_id = ? ORDER BY created_at ASC')
			.all(pieceId) as Array<{ id: string; piece_id: string; url: string; label: string; created_at: string }>;
		expect(rows).toHaveLength(2);
		expect(rows[1].label).toBe('v2');
		expect(rows[1].url).toBe('/pdf/new.pdf');
	});
});
