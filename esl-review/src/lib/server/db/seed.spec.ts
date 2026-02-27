/**
 * Seed-skripti test — TDD red phase
 *
 * Kontrollib, et seed-skript käivitub vigadeta ja laadib oodatud andmed.
 * Kasutab node:sqlite in-memory DB-d (sama muster nagu schema.spec.ts).
 *
 * Praegu KUKUB LÄBI — migrations/seed.sql pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');
const SCHEMA_PATH = join(MIGRATIONS_DIR, '0001_initial.sql');
const SEED_PATH = join(MIGRATIONS_DIR, 'seed.sql');

function openSeededDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(SCHEMA_PATH, 'utf-8'));
	db.exec(readFileSync(SEED_PATH, 'utf-8'));
	return db;
}

describe('seed-skript', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openSeededDb();
	});

	it('käivitub vigadeta', () => {
		// beforeEach oleks visanud erindi kui seed ebaõnnestus
		expect(db).toBeTruthy();
	});

	it('pieces tabelis on täpselt 20 rida', () => {
		const row = db.prepare('SELECT COUNT(*) as count FROM pieces').get() as { count: number };
		expect(row.count).toBe(20);
	});

	it('param_templates tabelis on 23 rida (16 per_voice + 7 whole_piece)', () => {
		const row = db.prepare('SELECT COUNT(*) as count FROM param_templates').get() as { count: number };
		expect(row.count).toBe(23);
	});

	it('param_templates: täpselt 16 per_voice parameetrit', () => {
		const row = db
			.prepare("SELECT COUNT(*) as count FROM param_templates WHERE scope='per_voice'")
			.get() as { count: number };
		expect(row.count).toBe(16);
	});

	it('param_templates: täpselt 7 whole_piece parameetrit', () => {
		const row = db
			.prepare("SELECT COUNT(*) as count FROM param_templates WHERE scope='whole_piece'")
			.get() as { count: number };
		expect(row.count).toBe(7);
	});

	it('vähemalt üks piece on staatuses korrektuuris', () => {
		const row = db
			.prepare("SELECT COUNT(*) as count FROM pieces WHERE status='korrektuuris'")
			.get() as { count: number };
		expect(row.count).toBeGreaterThanOrEqual(1);
	});
});
