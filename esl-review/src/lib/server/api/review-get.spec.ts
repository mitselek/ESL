/**
 * GET /api/reviews/[id] handler test — TDD red phase
 *
 * Testib getReview() funktsiooni otse node:sqlite DatabaseSync-iga.
 * Avalik endpoint — auth pole vajalik.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/review-get.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { getReview } from './review-get.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const REVIEWER_ID = 'user-reviewer-get';
const PIECE_ID = 'piece-review-get';
const REVIEW_ID = 'review-test-001';
const ENTRY_ID = 'entry-test-001';
const PARAM_ID = 'param-test-001';
const TEMPLATE_ID = 'template-test-001';

function openDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));

	// Kasutaja
	db.prepare('INSERT INTO users (id, email, name) VALUES (?, ?, ?)').run(
		REVIEWER_ID, 'reviewer-get@example.com', 'Reviewer Get'
	);

	// Noot
	db.prepare(
		"INSERT INTO pieces (id, title, status, reviewer_id) VALUES (?, ?, 'korrektuuris', ?)"
	).run(PIECE_ID, 'Testlugu', REVIEWER_ID);

	// Parameetri mall
	db.prepare(
		"INSERT INTO param_templates (id, name, scope) VALUES (?, ?, 'per_voice')"
	).run(TEMPLATE_ID, 'Noodikõrgused');

	// Noodi-spetsiifiline parameeter
	db.prepare(
		'INSERT INTO piece_params (id, piece_id, template_id) VALUES (?, ?, ?)'
	).run(PARAM_ID, PIECE_ID, TEMPLATE_ID);

	// Review
	db.prepare(
		"INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url) VALUES (?, ?, ?, 'in_progress', 'https://example.com/test.pdf')"
	).run(REVIEW_ID, PIECE_ID, REVIEWER_ID);

	// Review entry
	db.prepare(
		"INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict, remarks) VALUES (?, ?, ?, NULL, 'ok', NULL)"
	).run(ENTRY_ID, REVIEW_ID, PARAM_ID);

	return db;
}

describe('GET /api/reviews/[id]', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openDb();
	});

	it('olematu id → null', () => {
		const result = getReview(db, 'olematu-review-id');
		expect(result).toBeNull();
	});

	it('kehtiv id → objekt (mitte null)', () => {
		const result = getReview(db, REVIEW_ID);
		expect(result).not.toBeNull();
	});

	it('põhiväljad: id, piece_id, reviewer, status, pdf_url, created_at', () => {
		const result = getReview(db, REVIEW_ID)!;
		expect(result).toHaveProperty('id', REVIEW_ID);
		expect(result).toHaveProperty('piece_id', PIECE_ID);
		expect(result).toHaveProperty('reviewer', REVIEWER_ID);
		expect(result).toHaveProperty('status', 'in_progress');
		expect(result).toHaveProperty('pdf_url', 'https://example.com/test.pdf');
		expect(result).toHaveProperty('created_at');
	});

	it('entries on array', () => {
		const result = getReview(db, REVIEW_ID)!;
		expect(result).toHaveProperty('entries');
		expect(Array.isArray(result.entries)).toBe(true);
	});

	it('entries sisaldab vähemalt ühe kirje', () => {
		const result = getReview(db, REVIEW_ID)!;
		expect(result.entries.length).toBeGreaterThanOrEqual(1);
	});

	it('iga entry sisaldab: id, param_id, voice_part_id, remarks, verdict', () => {
		const result = getReview(db, REVIEW_ID)!;
		for (const entry of result.entries) {
			expect(entry).toHaveProperty('id');
			expect(entry).toHaveProperty('param_id');
			expect(entry).toHaveProperty('voice_part_id');
			expect(entry).toHaveProperty('remarks');
			expect(entry).toHaveProperty('verdict');
		}
	});

	it('entry väljad vastavad sisestatud andmetele', () => {
		const result = getReview(db, REVIEW_ID)!;
		const entry = result.entries.find((e) => e.id === ENTRY_ID);
		expect(entry).toBeTruthy();
		expect(entry!.param_id).toBe(PARAM_ID);
		expect(entry!.voice_part_id).toBeNull();
		expect(entry!.verdict).toBe('ok');
	});

	it('review ilma entries-ita tagastab tühja array', () => {
		// Loo review ilma entry-deta
		db.prepare(
			"INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url) VALUES ('review-empty', ?, ?, 'in_progress', 'https://x.com/p.pdf')"
		).run(PIECE_ID, REVIEWER_ID);
		const result = getReview(db, 'review-empty')!;
		expect(result.entries).toEqual([]);
	});
});
