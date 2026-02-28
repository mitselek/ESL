/**
 * PUT /api/pieces/[id]/set-source-pdf handler test — TDD red phase
 *
 * Testib setSourcePdf() funktsiooni otse node:sqlite DatabaseSync-iga.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/set-source-pdf.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { setSourcePdf } from './set-source-pdf.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const TEST_PDF_URL = 'https://example.com/source.pdf';
const UPDATED_PDF_URL = 'https://example.com/source-v2.pdf';

function openSeededDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0004_review_redaction.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, 'seed.sql'), 'utf-8'));
	return db;
}

function getPieceIdByStatus(db: DatabaseSync, status: string): string {
	const row = db
		.prepare('SELECT id FROM pieces WHERE status = ? LIMIT 1')
		.get(status) as { id: string } | undefined;
	if (!row) throw new Error(`Seed andmestikus pole ühtegi noodid staatusega "${status}"`);
	return row.id;
}

describe('PUT /api/pieces/[id]/set-source-pdf', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openSeededDb();
	});

	it('olematu piece → { error, status: 404 }', () => {
		const result = setSourcePdf(db, 'olematu-id-xyz', TEST_PDF_URL);
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(404);
	});

	it('source_pdf_url tühi string → { error, status: 400 }', () => {
		const pieceId = getPieceIdByStatus(db, 'teos');
		const result = setSourcePdf(db, pieceId, '');
		expect(result).toHaveProperty('error');
		expect((result as { error: string; status: number }).status).toBe(400);
	});

	it('piece staatus "teos" + kehtiv URL → { ok: true }, DB-s source_pdf_url uuendatud, staatus muutub "lähtefail"', () => {
		const pieceId = getPieceIdByStatus(db, 'teos');
		const result = setSourcePdf(db, pieceId, TEST_PDF_URL);
		expect(result).toEqual({ ok: true });

		const row = db
			.prepare('SELECT source_pdf_url, status FROM pieces WHERE id = ?')
			.get(pieceId) as { source_pdf_url: string; status: string };
		expect(row.source_pdf_url).toBe(TEST_PDF_URL);
		expect(row.status).toBe('lähtefail');
	});

	it('piece staatus "lähtefail" + uus URL → { ok: true }, URL uuendatud, staatus jääb "lähtefail"', () => {
		// Seadista piece staatusesse 'lähtefail' eelnevalt
		const pieceId = getPieceIdByStatus(db, 'teos');
		db.prepare("UPDATE pieces SET status = 'lähtefail', source_pdf_url = ? WHERE id = ?").run(
			TEST_PDF_URL, pieceId
		);

		const result = setSourcePdf(db, pieceId, UPDATED_PDF_URL);
		expect(result).toEqual({ ok: true });

		const row = db
			.prepare('SELECT source_pdf_url, status FROM pieces WHERE id = ?')
			.get(pieceId) as { source_pdf_url: string; status: string };
		expect(row.source_pdf_url).toBe(UPDATED_PDF_URL);
		expect(row.status).toBe('lähtefail');
	});

	it('piece staatus "küljenduses" + URL → { ok: true }, URL uuendatud, staatus ei muutu', () => {
		// Seadista piece staatusesse 'küljenduses'
		const pieceId = getPieceIdByStatus(db, 'teos');
		db.prepare("UPDATE pieces SET status = 'küljenduses' WHERE id = ?").run(pieceId);

		const result = setSourcePdf(db, pieceId, TEST_PDF_URL);
		expect(result).toEqual({ ok: true });

		const row = db
			.prepare('SELECT source_pdf_url, status FROM pieces WHERE id = ?')
			.get(pieceId) as { source_pdf_url: string; status: string };
		expect(row.source_pdf_url).toBe(TEST_PDF_URL);
		expect(row.status).toBe('küljenduses');
	});
});
