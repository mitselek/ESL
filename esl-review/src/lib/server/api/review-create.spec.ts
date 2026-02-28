/**
 * POST /api/reviews handler test — TDD red phase
 *
 * Testib createReview() funktsiooni otse node:sqlite DatabaseSync-iga.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/review-create.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { createReview } from './review-create.js';
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

const OTHER_USER: User = {
	id: 'user-other',
	email: 'other@example.com',
	name: 'Other',
	picture: null
};

const TEST_PDF_URL = 'https://example.com/test.pdf';

function openSeededDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0004_review_redaction.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, 'seed.sql'), 'utf-8'));
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		TYPESETTER_USER.id, TYPESETTER_USER.email, TYPESETTER_USER.name, TYPESETTER_USER.picture
	);
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		REVIEWER_USER.id, REVIEWER_USER.email, REVIEWER_USER.name, REVIEWER_USER.picture
	);
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		OTHER_USER.id, OTHER_USER.email, OTHER_USER.name, OTHER_USER.picture
	);
	return db;
}

function getPieceId(db: DatabaseSync): string {
	const row = db.prepare('SELECT id FROM pieces LIMIT 1').get() as { id: string };
	return row.id;
}

// Seadistab noodi korrektuuri-valmis olekusse
function setupPiece(db: DatabaseSync, pieceId: string) {
	db.prepare(
		"UPDATE pieces SET status = 'korrektuuris', reviewer_id = ?, typesetter_id = ?, pdf_url = ? WHERE id = ?"
	).run(REVIEWER_USER.id, TYPESETTER_USER.id, TEST_PDF_URL, pieceId);
}

describe('POST /api/reviews', () => {
	let db: DatabaseSync;
	let pieceId: string;

	beforeEach(() => {
		db = openSeededDb();
		pieceId = getPieceId(db);
	});

	it('olematu noot → { error, status: 404 }', () => {
		const result = createReview(db, 'olematu-id', REVIEWER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(404);
	});

	it('kasutaja pole korrektor → { error, status: 403 }', () => {
		setupPiece(db, pieceId);
		const result = createReview(db, pieceId, OTHER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(403);
	});

	it('vale staatus (mitte korrektuuris) → { error, status: 409 }', () => {
		db.prepare("UPDATE pieces SET status = 'teos', reviewer_id = ?, pdf_url = ? WHERE id = ?").run(
			REVIEWER_USER.id, TEST_PDF_URL, pieceId
		);
		const result = createReview(db, pieceId, REVIEWER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('juba in_progress review → { error: "Review already in progress", status: 409 }', () => {
		setupPiece(db, pieceId);
		// Loo esimene review
		createReview(db, pieceId, REVIEWER_USER);
		// Teine katse sama noodi jaoks
		const result = createReview(db, pieceId, REVIEWER_USER);
		expect(result).toHaveProperty('error', 'Review already in progress');
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('kehtiv → { ok: true, id: string }', () => {
		setupPiece(db, pieceId);
		const result = createReview(db, pieceId, REVIEWER_USER);
		expect((result as { ok: true; id: string }).ok).toBe(true);
		expect(typeof (result as { ok: true; id: string }).id).toBe('string');
	});

	it('DB-s reviews kirje: piece_id, reviewer, status = in_progress', () => {
		setupPiece(db, pieceId);
		const result = createReview(db, pieceId, REVIEWER_USER) as { ok: true; id: string };
		const row = db
			.prepare('SELECT piece_id, reviewer, status FROM reviews WHERE id = ?')
			.get(result.id) as { piece_id: string; reviewer: string; status: string } | undefined;
		expect(row).toBeTruthy();
		expect(row!.piece_id).toBe(pieceId);
		expect(row!.reviewer).toBe(REVIEWER_USER.id);
		expect(row!.status).toBe('in_progress');
	});

	it('pdf_url reviews kirjes = pieces.pdf_url', () => {
		setupPiece(db, pieceId);
		const result = createReview(db, pieceId, REVIEWER_USER) as { ok: true; id: string };
		const row = db
			.prepare('SELECT pdf_url FROM reviews WHERE id = ?')
			.get(result.id) as { pdf_url: string } | undefined;
		expect(row!.pdf_url).toBe(TEST_PDF_URL);
	});

	it('seob review viimasele redaktsioonile', () => {
		setupPiece(db, pieceId);

		// Lisa 2 redaktsiooni — vanem ja uuem
		db.prepare(
			"INSERT INTO piece_redactions (id, piece_id, url, label, created_at) VALUES (?, ?, ?, ?, ?)"
		).run('redaction-old', pieceId, 'https://example.com/v1.pdf', 'v1', '2025-01-01T00:00:00');
		db.prepare(
			"INSERT INTO piece_redactions (id, piece_id, url, label, created_at) VALUES (?, ?, ?, ?, ?)"
		).run('redaction-new', pieceId, 'https://example.com/v2.pdf', 'v2', '2025-06-01T00:00:00');

		const result = createReview(db, pieceId, REVIEWER_USER) as { ok: true; id: string };

		const row = db
			.prepare('SELECT redaction_id FROM reviews WHERE id = ?')
			.get(result.id) as { redaction_id: string | null } | undefined;

		expect(row).toBeTruthy();
		expect(row!.redaction_id).toBe('redaction-new');
	});
});
