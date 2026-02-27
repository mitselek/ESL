/**
 * GET /api/pieces handler test — TDD red phase
 *
 * Testib handler-funktsiooni otse (mitte HTTP requesti kaudu).
 * Kasutab node:sqlite in-memory DB-d schema + seed andmetega.
 *
 * Praegu KUKUB LÄBI — handler pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { getPieces, type PiecesQuery } from './pieces.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

function openSeededDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, 'seed.sql'), 'utf-8'));
	return db;
}

describe('GET /api/pieces', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openSeededDb();
	});

	it('tagastab array', () => {
		const result = getPieces(db, {});
		expect(Array.isArray(result)).toBe(true);
	});

	it('tagastab täpselt 20 noodid (seed andmestik)', () => {
		const result = getPieces(db, {});
		expect(result).toHaveLength(20);
	});

	it('iga noot sisaldab nõutud väljad', () => {
		const result = getPieces(db, {});
		for (const piece of result) {
			expect(piece).toHaveProperty('id');
			expect(piece).toHaveProperty('title');
			expect(piece).toHaveProperty('composer');
			expect(piece).toHaveProperty('section');
			expect(piece).toHaveProperty('status');
			expect(piece).toHaveProperty('notes');
			expect(piece).toHaveProperty('typesetter');
			expect(piece).toHaveProperty('reviewer');
		}
	});

	it('typesetter on null või {id, name}', () => {
		const result = getPieces(db, {});
		for (const piece of result) {
			if (piece.typesetter !== null) {
				expect(piece.typesetter).toHaveProperty('id');
				expect(piece.typesetter).toHaveProperty('name');
			}
		}
	});

	it('reviewer on null või {id, name}', () => {
		const result = getPieces(db, {});
		for (const piece of result) {
			if (piece.reviewer !== null) {
				expect(piece.reviewer).toHaveProperty('id');
				expect(piece.reviewer).toHaveProperty('name');
			}
		}
	});

	it('noodid on section järgi sorteeritud (I → II → III → IV)', () => {
		const result = getPieces(db, {});
		const sections = result.map((p) => p.section);
		const sorted = [...sections].sort((a, b) => {
			const order = ['I', 'II', 'III', 'IV'];
			return order.indexOf(a) - order.indexOf(b);
		});
		expect(sections).toEqual(sorted);
	});

	it('filtreerib staatuse järgi: ?status=korrektuuris', () => {
		const all = getPieces(db, {});
		const korrektuuris = getPieces(db, { status: 'korrektuuris' });
		expect(korrektuuris.length).toBeGreaterThanOrEqual(1);
		expect(korrektuuris.length).toBeLessThan(all.length);
		for (const piece of korrektuuris) {
			expect(piece.status).toBe('korrektuuris');
		}
	});
});
