/**
 * GET /api/pieces/[id] handler test — TDD red phase
 *
 * Testib getPiece() funktsiooni otse node:sqlite DatabaseSync-iga.
 * Avalik endpoint — auth pole vajalik.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/piece.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { getPiece } from './piece.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

function openSeededDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0004_review_redaction.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, 'seed.sql'), 'utf-8'));
	return db;
}

describe('GET /api/pieces/[id]', () => {
	let db: DatabaseSync;
	let firstPieceId: string;

	beforeEach(() => {
		db = openSeededDb();
		const row = db.prepare('SELECT id FROM pieces LIMIT 1').get() as { id: string };
		firstPieceId = row.id;
	});

	it('olematu id → tagastab null (404)', () => {
		const result = getPiece(db, 'olematu-id-xyz');
		expect(result).toBeNull();
	});

	it('kehtiv id → tagastab noodi objekti', () => {
		const result = getPiece(db, firstPieceId);
		expect(result).not.toBeNull();
	});

	describe('põhiväljad', () => {
		it('sisaldab id, title, composer, section, status, notes, pdf_url', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result).toHaveProperty('id');
			expect(result).toHaveProperty('title');
			expect(result).toHaveProperty('composer');
			expect(result).toHaveProperty('section');
			expect(result).toHaveProperty('status');
			expect(result).toHaveProperty('notes');
			expect(result).toHaveProperty('pdf_url');
		});

		it('id vastab päringule', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result.id).toBe(firstPieceId);
		});
	});

	describe('source_pdf_url ja pageflow_matched', () => {
		it('sisaldab source_pdf_url välja', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result).toHaveProperty('source_pdf_url');
		});

		it('sisaldab pageflow_matched välja', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result).toHaveProperty('pageflow_matched');
		});

		it('seed andmetes source_pdf_url on null ja pageflow_matched on 0', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result.source_pdf_url).toBeNull();
			expect(result.pageflow_matched).toBe(0);
		});
	});

	describe('typesetter ja reviewer', () => {
		it('typesetter on null või {id, name}', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result).toHaveProperty('typesetter');
			if (result.typesetter !== null) {
				expect(result.typesetter).toHaveProperty('id');
				expect(result.typesetter).toHaveProperty('name');
			}
		});

		it('reviewer on null või {id, name}', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result).toHaveProperty('reviewer');
			if (result.reviewer !== null) {
				expect(result.reviewer).toHaveProperty('id');
				expect(result.reviewer).toHaveProperty('name');
			}
		});
	});

	describe('voice_parts', () => {
		it('sisaldab voice_parts array', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result).toHaveProperty('voice_parts');
			expect(Array.isArray(result.voice_parts)).toBe(true);
		});

		it('iga voice_part sisaldab {id, name, sort_order}', () => {
			// leia noot, millel on voice_parts
			const rows = db.prepare('SELECT DISTINCT piece_id FROM voice_parts LIMIT 1').all() as Array<{ piece_id: string }>;
			if (rows.length === 0) return; // seed'is pole voice_parts — skip
			const result = getPiece(db, rows[0].piece_id)!;
			for (const vp of result.voice_parts) {
				expect(vp).toHaveProperty('id');
				expect(vp).toHaveProperty('name');
				expect(vp).toHaveProperty('sort_order');
			}
		});
	});

	describe('piece_params', () => {
		it('sisaldab piece_params array', () => {
			const result = getPiece(db, firstPieceId)!;
			expect(result).toHaveProperty('piece_params');
			expect(Array.isArray(result.piece_params)).toBe(true);
		});

		it('iga piece_param sisaldab {id, template_id, sort_order, is_active, template_name, scope}', () => {
			// leia noot, millel on piece_params
			const rows = db.prepare('SELECT DISTINCT piece_id FROM piece_params LIMIT 1').all() as Array<{ piece_id: string }>;
			if (rows.length === 0) return; // seed'is pole piece_params — skip
			const result = getPiece(db, rows[0].piece_id)!;
			for (const pp of result.piece_params) {
				expect(pp).toHaveProperty('id');
				expect(pp).toHaveProperty('template_id');
				expect(pp).toHaveProperty('sort_order');
				expect(pp).toHaveProperty('is_active');
				expect(pp).toHaveProperty('param_name');
				expect(pp).toHaveProperty('scope');
			}
		});
	});

	describe('redactions', () => {
		it('tagastab piece redactions', () => {
			// lisa 2 redaction rida
			db.prepare('INSERT INTO piece_redactions (id, piece_id, url, label, created_at) VALUES (?, ?, ?, ?, ?)').run(
				'red-1', firstPieceId, '/pdf/v1.pdf', 'v1', '2026-01-01T10:00:00'
			);
			db.prepare('INSERT INTO piece_redactions (id, piece_id, url, label, created_at) VALUES (?, ?, ?, ?, ?)').run(
				'red-2', firstPieceId, '/pdf/v2.pdf', 'v2', '2026-01-02T10:00:00'
			);

			const result = getPiece(db, firstPieceId)!;
			expect(result.redactions).toHaveLength(2);
			// sorteeritud created_at ASC
			expect(result.redactions[0].label).toBe('v1');
			expect(result.redactions[0].url).toBe('/pdf/v1.pdf');
			expect(result.redactions[1].label).toBe('v2');
			expect(result.redactions[1].url).toBe('/pdf/v2.pdf');
		});
	});
});
