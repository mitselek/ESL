import type { DatabaseSync } from 'node:sqlite';

interface D1Db {
	prepare(query: string): {
		bind(...values: unknown[]): {
			first<T = Record<string, unknown>>(): Promise<T | null>;
			all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
			run(): Promise<unknown>;
		};
	};
}

interface PieceRow {
	typesetter_id: string | null;
}

interface VoicePartRow {
	id: string;
	piece_id: string;
}

interface MaxSortRow {
	max_sort: number | null;
}

interface CountRow {
	cnt: number;
}

function apiError(message: string, status: number): never {
	const err = new Error(message) as Error & { status: number };
	err.status = status;
	throw err;
}

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function addVoicePart(
	db: DatabaseSync,
	pieceId: string,
	name: string,
	user: { id: string }
): { id: string } {
	const piece = db
		.prepare('SELECT typesetter_id FROM pieces WHERE id = ?')
		.get(pieceId) as unknown as PieceRow | undefined;

	if (!piece) apiError('Not found', 404);
	if (piece.typesetter_id !== user.id) apiError('Forbidden', 403);

	const sortRow = db
		.prepare('SELECT MAX(sort_order) as max_sort FROM voice_parts WHERE piece_id = ?')
		.get(pieceId) as unknown as MaxSortRow;
	const sortOrder = (sortRow.max_sort ?? 0) + 1;

	const id = crypto.randomUUID();

	db.prepare('INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES (?, ?, ?, ?)').run(
		id,
		pieceId,
		name,
		sortOrder
	);

	// Lisa piece_params kõigi is_default=1 param_templates jaoks
	const templates = db
		.prepare('SELECT id FROM param_templates WHERE is_default = 1')
		.all() as unknown as { id: string }[];

	for (const tmpl of templates) {
		db.prepare('INSERT INTO piece_params (id, piece_id, template_id) VALUES (?, ?, ?)').run(
			crypto.randomUUID(),
			pieceId,
			tmpl.id
		);
	}

	return { id };
}

export function deleteVoicePart(
	db: DatabaseSync,
	pieceId: string,
	voicePartId: string,
	user: { id: string }
): void {
	const vp = db
		.prepare('SELECT id, piece_id FROM voice_parts WHERE id = ? AND piece_id = ?')
		.get(voicePartId, pieceId) as unknown as VoicePartRow | undefined;

	if (!vp) apiError('Not found', 404);

	const piece = db
		.prepare('SELECT typesetter_id FROM pieces WHERE id = ?')
		.get(pieceId) as unknown as PieceRow | undefined;

	if (!piece || piece.typesetter_id !== user.id) apiError('Forbidden', 403);

	const entryCount = db
		.prepare('SELECT COUNT(*) as cnt FROM review_entries WHERE voice_part_id = ?')
		.get(voicePartId) as unknown as CountRow;

	if (entryCount.cnt > 0) apiError('Conflict', 409);

	db.prepare('DELETE FROM voice_parts WHERE id = ?').run(voicePartId);
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function addVoicePartD1(
	db: D1Db,
	pieceId: string,
	name: string,
	user: { id: string }
): Promise<{ id: string }> {
	const piece = await db
		.prepare('SELECT typesetter_id FROM pieces WHERE id = ?')
		.bind(pieceId)
		.first<PieceRow>();

	if (!piece) apiError('Not found', 404);
	if (piece.typesetter_id !== user.id) apiError('Forbidden', 403);

	const sortRow = await db
		.prepare('SELECT MAX(sort_order) as max_sort FROM voice_parts WHERE piece_id = ?')
		.bind(pieceId)
		.first<MaxSortRow>();
	const sortOrder = ((sortRow?.max_sort) ?? 0) + 1;

	const id = crypto.randomUUID();

	await db
		.prepare('INSERT INTO voice_parts (id, piece_id, name, sort_order) VALUES (?, ?, ?, ?)')
		.bind(id, pieceId, name, sortOrder)
		.run();

	const { results: templates } = await db
		.prepare('SELECT id FROM param_templates WHERE is_default = 1')
		.bind()
		.all<{ id: string }>();

	for (const tmpl of templates) {
		await db
			.prepare('INSERT INTO piece_params (id, piece_id, template_id) VALUES (?, ?, ?)')
			.bind(crypto.randomUUID(), pieceId, tmpl.id)
			.run();
	}

	return { id };
}

export async function deleteVoicePartD1(
	db: D1Db,
	pieceId: string,
	voicePartId: string,
	user: { id: string }
): Promise<void> {
	const vp = await db
		.prepare('SELECT id, piece_id FROM voice_parts WHERE id = ? AND piece_id = ?')
		.bind(voicePartId, pieceId)
		.first<VoicePartRow>();

	if (!vp) apiError('Not found', 404);

	const piece = await db
		.prepare('SELECT typesetter_id FROM pieces WHERE id = ?')
		.bind(pieceId)
		.first<PieceRow>();

	if (!piece || piece.typesetter_id !== user.id) apiError('Forbidden', 403);

	const entryCount = await db
		.prepare('SELECT COUNT(*) as cnt FROM review_entries WHERE voice_part_id = ?')
		.bind(voicePartId)
		.first<CountRow>();

	if (entryCount && entryCount.cnt > 0) apiError('Conflict', 409);

	await db.prepare('DELETE FROM voice_parts WHERE id = ?').bind(voicePartId).run();
}
