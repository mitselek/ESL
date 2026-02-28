/**
 * DB schema test — TDD red phase
 *
 * Kontrollib, et kõik 7 tabelit eksisteerivad ja kriitilised veerud on olemas.
 * Kasutab Node.js sisseehitatud node:sqlite in-memory DB-d.
 *
 * Praegu KUKUB LÄBI — migratsioonifailid pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';

// Migratsioonifailid, mida testime
const MIGRATIONS_DIR = join(
	import.meta.dirname,
	'../../../..',  // esl-review/
	'migrations'
);

function openDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));
	return db;
}

function getTableNames(db: DatabaseSync): string[] {
	const rows = db.prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name").all() as Array<{ name: string }>;
	return rows.map((r) => r.name);
}

function getColumnNames(db: DatabaseSync, table: string): string[] {
	const rows = db.prepare(`PRAGMA table_info(${table})`).all() as Array<{ name: string }>;
	return rows.map((r) => r.name);
}

describe('DB schema', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openDb();
	});

	describe('tabelid eksisteerivad', () => {
		const EXPECTED_TABLES = [
			'users',
			'pieces',
			'voice_parts',
			'param_templates',
			'piece_params',
			'reviews',
			'review_entries'
		];

		for (const table of EXPECTED_TABLES) {
			it(`tabel "${table}" eksisteerib`, () => {
				expect(getTableNames(db)).toContain(table);
			});
		}
	});

	describe('kriitilised veerud', () => {
		it('users: id, email, name, picture, created_at', () => {
			const cols = getColumnNames(db, 'users');
			expect(cols).toContain('id');
			expect(cols).toContain('email');
			expect(cols).toContain('name');
			expect(cols).toContain('picture');
			expect(cols).toContain('created_at');
		});

		it('pieces: typesetter_id ja reviewer_id FK-d', () => {
			const cols = getColumnNames(db, 'pieces');
			expect(cols).toContain('typesetter_id');
			expect(cols).toContain('reviewer_id');
		});

		it('pieces: status, pdf_url', () => {
			const cols = getColumnNames(db, 'pieces');
			expect(cols).toContain('status');
			expect(cols).toContain('pdf_url');
		});

		it('reviews: pdf_url (revisioniga seotud PDF)', () => {
			const cols = getColumnNames(db, 'reviews');
			expect(cols).toContain('pdf_url');
		});

		it('reviews: reviewer FK, status', () => {
			const cols = getColumnNames(db, 'reviews');
			expect(cols).toContain('reviewer');
			expect(cols).toContain('status');
		});

		it('review_entries: remarks (JSON), verdict', () => {
			const cols = getColumnNames(db, 'review_entries');
			expect(cols).toContain('remarks');
			expect(cols).toContain('verdict');
		});

		it('review_entries: voice_part_id (nullable FK)', () => {
			const cols = getColumnNames(db, 'review_entries');
			expect(cols).toContain('voice_part_id');
		});

		it('piece_params: is_active, sort_order', () => {
			const cols = getColumnNames(db, 'piece_params');
			expect(cols).toContain('is_active');
			expect(cols).toContain('sort_order');
		});

		it('param_templates: scope, sort_order', () => {
			const cols = getColumnNames(db, 'param_templates');
			expect(cols).toContain('scope');
			expect(cols).toContain('sort_order');
		});
	});

	describe('0002_source_pdf migratsiooni veerud', () => {
		it('pieces: source_pdf_url', () => {
			const cols = getColumnNames(db, 'pieces');
			expect(cols).toContain('source_pdf_url');
		});

		it('pieces: pageflow_matched vaikeväärtusega 0', () => {
			const cols = getColumnNames(db, 'pieces');
			expect(cols).toContain('pageflow_matched');
			// Kontrolli vaikeväärtust: lisa rida ja vaata tulemust
			db.prepare("INSERT INTO pieces (id, title) VALUES ('test-default', 'Test')").run();
			const row = db.prepare("SELECT pageflow_matched FROM pieces WHERE id = 'test-default'").get() as { pageflow_matched: number };
			expect(row.pageflow_matched).toBe(0);
		});
	});
});
