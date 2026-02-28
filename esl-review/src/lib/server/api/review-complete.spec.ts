/**
 * PUT /api/reviews/[id] handler test — TDD red phase
 *
 * Testib completeReview() funktsiooni otse node:sqlite DatabaseSync-iga.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/review-complete.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { completeReview } from './review-complete.js';
import type { User } from '../auth.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const REVIEWER_USER: User = {
	id: 'user-reviewer-complete',
	email: 'reviewer-complete@example.com',
	name: 'Reviewer Complete',
	picture: null
};

const OTHER_USER: User = {
	id: 'user-other-complete',
	email: 'other-complete@example.com',
	name: 'Other Complete',
	picture: null
};

const PIECE_ID = 'piece-complete-test';
const REVIEW_ID = 'review-complete-test';

function openDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));

	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		REVIEWER_USER.id, REVIEWER_USER.email, REVIEWER_USER.name, REVIEWER_USER.picture
	);
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		OTHER_USER.id, OTHER_USER.email, OTHER_USER.name, OTHER_USER.picture
	);

	// Noot staatusega korrektuuris
	db.prepare(
		"INSERT INTO pieces (id, title, status, reviewer_id) VALUES (?, 'Testlugu', 'korrektuuris', ?)"
	).run(PIECE_ID, REVIEWER_USER.id);

	// Review staatusega in_progress
	db.prepare(
		"INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url) VALUES (?, ?, ?, 'in_progress', 'https://example.com/test.pdf')"
	).run(REVIEW_ID, PIECE_ID, REVIEWER_USER.id);

	return db;
}

describe('PUT /api/reviews/[id] (complete)', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openDb();
	});

	it('olematu review → { error, status: 404 }', () => {
		const result = completeReview(db, 'olematu-review-id', REVIEWER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(404);
	});

	it('kasutaja pole reviewer → { error, status: 403 }', () => {
		const result = completeReview(db, REVIEW_ID, OTHER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(403);
	});

	it('review pole in_progress (juba completed) → { error, status: 409 }', () => {
		db.prepare("UPDATE reviews SET status = 'completed' WHERE id = ?").run(REVIEW_ID);
		const result = completeReview(db, REVIEW_ID, REVIEWER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('kehtiv → { ok: true }', () => {
		const result = completeReview(db, REVIEW_ID, REVIEWER_USER);
		expect(result).toEqual({ ok: true });
	});

	it('DB-s reviews.status = completed pärast kutsumist', () => {
		completeReview(db, REVIEW_ID, REVIEWER_USER);
		const row = db
			.prepare('SELECT status FROM reviews WHERE id = ?')
			.get(REVIEW_ID) as { status: string };
		expect(row.status).toBe('completed');
	});

	it('DB-s pieces.status = kontrollitud pärast kutsumist (automaatüleminek)', () => {
		completeReview(db, REVIEW_ID, REVIEWER_USER);
		const row = db
			.prepare('SELECT status FROM pieces WHERE id = ?')
			.get(PIECE_ID) as { status: string };
		expect(row.status).toBe('kontrollitud');
	});
});
