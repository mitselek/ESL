/**
 * GET /api/users handler test — TDD
 *
 * Testib getUsers() funktsiooni otse node:sqlite DatabaseSync-iga.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { getUsers } from './users.js';
import type { User } from '../auth.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const TEST_USER: User = {
	id: 'user-123',
	email: 'test@example.com',
	name: 'Test User',
	picture: 'https://example.com/pic.jpg'
};

function openSeededDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, 'seed.sql'), 'utf-8'));
	return db;
}

function openEmptyDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0003_piece_redactions.sql'), 'utf-8'));
	return db;
}

describe('GET /api/users', () => {
	describe('sisselogimata', () => {
		let db: DatabaseSync;

		beforeEach(() => {
			db = openSeededDb();
		});

		it('user=null → tagastab null (401 märk)', () => {
			const result = getUsers(db, null);
			expect(result).toBeNull();
		});
	});

	describe('sisselogitud', () => {
		let db: DatabaseSync;

		beforeEach(() => {
			db = openSeededDb();
			db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
				TEST_USER.id,
				TEST_USER.email,
				TEST_USER.name,
				TEST_USER.picture
			);
		});

		it('tagastab array', () => {
			const result = getUsers(db, TEST_USER);
			expect(Array.isArray(result)).toBe(true);
		});

		it('iga kasutaja sisaldab id ja name', () => {
			const result = getUsers(db, TEST_USER)!;
			expect(result.length).toBeGreaterThanOrEqual(1);
			for (const u of result) {
				expect(u).toHaveProperty('id');
				expect(u).toHaveProperty('name');
			}
		});

		it('kasutaja EI sisalda emaili (privaatsus)', () => {
			const result = getUsers(db, TEST_USER)!;
			for (const u of result) {
				expect(u).not.toHaveProperty('email');
			}
		});

		it('kasutaja EI sisalda picture\'t (privaatsus)', () => {
			const result = getUsers(db, TEST_USER)!;
			for (const u of result) {
				expect(u).not.toHaveProperty('picture');
			}
		});

		it('kasutaja sisaldab AINULT {id, name}', () => {
			const result = getUsers(db, TEST_USER)!;
			for (const u of result) {
				expect(Object.keys(u)).toHaveLength(2);
				expect(Object.keys(u)).toContain('id');
				expect(Object.keys(u)).toContain('name');
			}
		});
	});

	describe('tühi kasutajate tabel', () => {
		let db: DatabaseSync;

		beforeEach(() => {
			db = openEmptyDb();
		});

		it('tühi array kui kasutajaid pole', () => {
			const result = getUsers(db, TEST_USER);
			expect(result).toEqual([]);
		});
	});
});
