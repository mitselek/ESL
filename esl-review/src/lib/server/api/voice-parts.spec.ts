/**
 * voice_parts CRUD handler test — TDD red phase
 *
 * Testib addVoicePart() ja deleteVoicePart() funktsioone otse node:sqlite DatabaseSync-iga.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/voice-parts.ts pole veel loodud.
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it, expect, beforeEach } from 'vitest';
import { addVoicePart, deleteVoicePart } from './voice-parts.js';
import type { User } from '../auth.js';

const MIGRATIONS_DIR = join(import.meta.dirname, '../../../..', 'migrations');

const TYPESETTER_USER: User = {
	id: 'user-typesetter-vp',
	email: 'typesetter-vp@example.com',
	name: 'Typesetter VP',
	picture: null
};

const OTHER_USER: User = {
	id: 'user-other-vp',
	email: 'other-vp@example.com',
	name: 'Other VP',
	picture: null
};

const PIECE_ID = 'piece-vp-test';

function openDb(): DatabaseSync {
	const db = new DatabaseSync(':memory:');
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0001_initial.sql'), 'utf-8'));
	db.exec(readFileSync(join(MIGRATIONS_DIR, '0002_source_pdf.sql'), 'utf-8'));

	// Lisa testkasutajad
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		TYPESETTER_USER.id, TYPESETTER_USER.email, TYPESETTER_USER.name, TYPESETTER_USER.picture
	);
	db.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)').run(
		OTHER_USER.id, OTHER_USER.email, OTHER_USER.name, OTHER_USER.picture
	);

	// Lisa testpiece, mille typesetter on TYPESETTER_USER
	db.prepare(
		"INSERT INTO pieces (id, title, status, typesetter_id) VALUES (?, 'Testlugu VP', 'küljenduses', ?)"
	).run(PIECE_ID, TYPESETTER_USER.id);

	return db;
}

describe('addVoicePart', () => {
	let db: DatabaseSync;

	beforeEach(() => {
		db = openDb();
	});

	it('edukalt lisab häälerühma — tagastab { id }', () => {
		const result = addVoicePart(db, PIECE_ID, 'Sopran', TYPESETTER_USER);
		expect(result).toHaveProperty('id');
		expect(typeof result.id).toBe('string');

		// Verifitseeri DB-st
		const row = db
			.prepare('SELECT id, piece_id, name FROM voice_parts WHERE id = ?')
			.get(result.id) as { id: string; piece_id: string; name: string } | undefined;
		expect(row).toBeTruthy();
		expect(row!.piece_id).toBe(PIECE_ID);
		expect(row!.name).toBe('Sopran');
	});

	it('404 kui piece ei leidu', () => {
		expect(() => addVoicePart(db, 'olematu-piece-id', 'Sopran', TYPESETTER_USER)).toThrowError();
		try {
			addVoicePart(db, 'olematu-piece-id', 'Sopran', TYPESETTER_USER);
		} catch (e: unknown) {
			const err = e as { message: string; status: number };
			expect(err.status).toBe(404);
		}
	});

	it('403 kui kasutaja ei ole piece.typesetter_id', () => {
		expect(() => addVoicePart(db, PIECE_ID, 'Sopran', OTHER_USER)).toThrowError();
		try {
			addVoicePart(db, PIECE_ID, 'Sopran', OTHER_USER);
		} catch (e: unknown) {
			const err = e as { message: string; status: number };
			expect(err.status).toBe(403);
		}
	});
});

describe('deleteVoicePart', () => {
	let db: DatabaseSync;
	let voicePartId: string;

	beforeEach(() => {
		db = openDb();
		// Lisa voice_part, mida testides kustutada
		voicePartId = 'vp-delete-test';
		db.prepare('INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES (?, ?, ?, ?)').run(
			voicePartId, PIECE_ID, 'Alt', 0
		);
	});

	it('edukalt kustutab — SELECT tagastab null', () => {
		deleteVoicePart(db, PIECE_ID, voicePartId, TYPESETTER_USER);

		const row = db
			.prepare('SELECT id FROM voice_parts WHERE id = ?')
			.get(voicePartId) as { id: string } | undefined;
		expect(row).toBeUndefined();
	});

	it('404 kui voice_part ei leidu', () => {
		expect(() => deleteVoicePart(db, PIECE_ID, 'olematu-vp-id', TYPESETTER_USER)).toThrowError();
		try {
			deleteVoicePart(db, PIECE_ID, 'olematu-vp-id', TYPESETTER_USER);
		} catch (e: unknown) {
			const err = e as { message: string; status: number };
			expect(err.status).toBe(404);
		}
	});

	it('403 kui kasutaja ei ole typesetter', () => {
		expect(() => deleteVoicePart(db, PIECE_ID, voicePartId, OTHER_USER)).toThrowError();
		try {
			deleteVoicePart(db, PIECE_ID, voicePartId, OTHER_USER);
		} catch (e: unknown) {
			const err = e as { message: string; status: number };
			expect(err.status).toBe(403);
		}
	});

	it('409 kui review_entries tabelis on kirjeid selle voice_part_id-ga', () => {
		// Loo vajalik andmestik: param_template → piece_param → review → review_entry
		const templateId = 'tmpl-vp-conflict';
		const paramId = 'param-vp-conflict';
		const reviewId = 'review-vp-conflict';
		const entryId = 'entry-vp-conflict';

		db.prepare(
			"INSERT INTO param_templates (id, name, scope) VALUES (?, 'Test param', 'per_voice')"
		).run(templateId);

		db.prepare('INSERT INTO piece_params (id, piece_id, template_id) VALUES (?, ?, ?)').run(
			paramId, PIECE_ID, templateId
		);

		db.prepare(
			"INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url) VALUES (?, ?, ?, 'in_progress', 'https://example.com/test.pdf')"
		).run(reviewId, PIECE_ID, OTHER_USER.id);

		db.prepare(
			"INSERT INTO review_entries (id, review_id, param_id, voice_part_id, verdict) VALUES (?, ?, ?, ?, 'ok')"
		).run(entryId, reviewId, paramId, voicePartId);

		// Nüüd proovi kustutada — peaks viskama 409
		expect(() => deleteVoicePart(db, PIECE_ID, voicePartId, TYPESETTER_USER)).toThrowError();
		try {
			deleteVoicePart(db, PIECE_ID, voicePartId, TYPESETTER_USER);
		} catch (e: unknown) {
			const err = e as { message: string; status: number };
			expect(err.status).toBe(409);
		}
	});
});
