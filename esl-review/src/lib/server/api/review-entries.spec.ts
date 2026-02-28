/**
 * PUT /api/reviews/[id]/entries handler test — TDD red phase
 *
 * Testib upsertReviewEntries() funktsiooni otse node:sqlite DatabaseSync-iga.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/review-entries.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { upsertReviewEntries } from './review-entries.js';
import type { User } from '../auth.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const REVIEWER_USER: User = {
	id: 'user-reviewer-entries',
	email: 'reviewer-entries@example.com',
	name: 'Reviewer Entries',
	picture: null
};

const OTHER_USER: User = {
	id: 'user-other-entries',
	email: 'other-entries@example.com',
	name: 'Other Entries',
	picture: null
};

const PIECE_ID = 'piece-entries-test';
const REVIEW_ID = 'review-entries-test';
const TEMPLATE_ID = 'template-entries-001';
const PARAM_ID_1 = 'param-entries-001';
const PARAM_ID_2 = 'param-entries-002';

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

	db.prepare(
		"INSERT INTO pieces (id, title, status, reviewer_id) VALUES (?, 'Testlugu', 'korrektuuris', ?)"
	).run(PIECE_ID, REVIEWER_USER.id);

	db.prepare(
		"INSERT INTO param_templates (id, name, scope) VALUES (?, 'Noodikõrgused', 'per_voice')"
	).run(TEMPLATE_ID);

	db.prepare('INSERT INTO piece_params (id, piece_id, template_id) VALUES (?, ?, ?)').run(
		PARAM_ID_1, PIECE_ID, TEMPLATE_ID
	);
	db.prepare('INSERT INTO piece_params (id, piece_id, template_id) VALUES (?, ?, ?)').run(
		PARAM_ID_2, PIECE_ID, TEMPLATE_ID
	);

	db.prepare(
		"INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url) VALUES (?, ?, ?, 'in_progress', 'https://example.com/test.pdf')"
	).run(REVIEW_ID, PIECE_ID, REVIEWER_USER.id);

	return db;
}

const SAMPLE_ENTRIES = [
	{ param_id: PARAM_ID_1, voice_part_id: null, verdict: 'ok', remarks: null },
	{
		param_id: PARAM_ID_2,
		voice_part_id: null,
		verdict: 'error',
		remarks: [{ bars: '5-8', text: 'Kolmas noot peaks olema F#' }]
	}
];

describe('PUT /api/reviews/[id]/entries', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openDb();
	});

	it('olematu review → { error, status: 404 }', () => {
		const result = upsertReviewEntries(db, 'olematu-review-id', SAMPLE_ENTRIES, REVIEWER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(404);
	});

	it('kasutaja pole reviewer → { error, status: 403 }', () => {
		const result = upsertReviewEntries(db, REVIEW_ID, SAMPLE_ENTRIES, OTHER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(403);
	});

	it('review pole in_progress → { error, status: 409 }', () => {
		db.prepare("UPDATE reviews SET status = 'completed' WHERE id = ?").run(REVIEW_ID);
		const result = upsertReviewEntries(db, REVIEW_ID, SAMPLE_ENTRIES, REVIEWER_USER);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(409);
	});

	it('tühi entries array → { ok: true }, DB-s entries kustutatud', () => {
		// Loo esmalt mõned entries
		upsertReviewEntries(db, REVIEW_ID, SAMPLE_ENTRIES, REVIEWER_USER);
		// Siis tühjenda
		const result = upsertReviewEntries(db, REVIEW_ID, [], REVIEWER_USER);
		expect(result).toEqual({ ok: true });
		const row = db
			.prepare('SELECT COUNT(*) as count FROM review_entries WHERE review_id = ?')
			.get(REVIEW_ID) as { count: number };
		expect(row.count).toBe(0);
	});

	it('kehtiv entries → { ok: true }, DB-s entries salvestatud', () => {
		const result = upsertReviewEntries(db, REVIEW_ID, SAMPLE_ENTRIES, REVIEWER_USER);
		expect(result).toEqual({ ok: true });
		const row = db
			.prepare('SELECT COUNT(*) as count FROM review_entries WHERE review_id = ?')
			.get(REVIEW_ID) as { count: number };
		expect(row.count).toBe(SAMPLE_ENTRIES.length);
	});

	it('DB-s remarks on JSON string (JSON.parse töötab)', () => {
		upsertReviewEntries(db, REVIEW_ID, SAMPLE_ENTRIES, REVIEWER_USER);
		const row = db
			.prepare("SELECT remarks FROM review_entries WHERE review_id = ? AND verdict = 'error'")
			.get(REVIEW_ID) as { remarks: string | null } | undefined;
		expect(row).toBeTruthy();
		// remarks peab olema JSON string või null
		if (row!.remarks !== null) {
			expect(() => JSON.parse(row!.remarks as string)).not.toThrow();
			const parsed = JSON.parse(row!.remarks as string);
			expect(Array.isArray(parsed)).toBe(true);
		}
	});

	it('idempotentsus: topeltkutsumine sama andmetega → DB-s sama arv entries', () => {
		upsertReviewEntries(db, REVIEW_ID, SAMPLE_ENTRIES, REVIEWER_USER);
		upsertReviewEntries(db, REVIEW_ID, SAMPLE_ENTRIES, REVIEWER_USER);
		const row = db
			.prepare('SELECT COUNT(*) as count FROM review_entries WHERE review_id = ?')
			.get(REVIEW_ID) as { count: number };
		expect(row.count).toBe(SAMPLE_ENTRIES.length);
	});
});
