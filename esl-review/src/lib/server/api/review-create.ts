import type { DatabaseSync } from 'node:sqlite';
import type { User } from '$lib/server/auth';

export type CreateReviewResult = { ok: true; id: string } | { error: string; status: number };

interface PieceReviewRow {
	reviewer_id: string | null;
	status: string;
	pdf_url: string | null;
}

interface D1Db {
	prepare(query: string): {
		bind(...values: unknown[]): {
			first<T = Record<string, unknown>>(): Promise<T | null>;
			run(): Promise<unknown>;
		};
	};
}

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function createReview(db: DatabaseSync, pieceId: string, user: User): CreateReviewResult {
	const piece = db
		.prepare('SELECT reviewer_id, status, pdf_url FROM pieces WHERE id = ?')
		.get(pieceId) as unknown as PieceReviewRow | undefined;

	if (!piece) return { error: 'Not found', status: 404 };
	if (piece.reviewer_id !== user.id) return { error: 'Forbidden', status: 403 };
	if (piece.status !== 'korrektuuris') return { error: 'Conflict', status: 409 };
	if (!piece.pdf_url) return { error: 'Piece has no PDF', status: 409 };

	const existing = db
		.prepare(`SELECT id FROM reviews WHERE piece_id = ? AND status = 'in_progress'`)
		.get(pieceId) as unknown as { id: string } | undefined;

	if (existing) return { error: 'Review already in progress', status: 409 };

	const id = crypto.randomUUID();

	const latestRedaction = db
		.prepare('SELECT id FROM piece_redactions WHERE piece_id = ? ORDER BY created_at DESC LIMIT 1')
		.get(pieceId) as unknown as { id: string } | undefined;

	db.prepare(
		'INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url, redaction_id) VALUES (?, ?, ?, ?, ?, ?)'
	).run(id, pieceId, user.id, 'in_progress', piece.pdf_url ?? null, latestRedaction?.id ?? null);

	return { ok: true, id };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function createReviewD1(
	db: D1Db,
	pieceId: string,
	user: User
): Promise<CreateReviewResult> {
	const piece = await db
		.prepare('SELECT reviewer_id, status, pdf_url FROM pieces WHERE id = ?')
		.bind(pieceId)
		.first<PieceReviewRow>();

	if (!piece) return { error: 'Not found', status: 404 };
	if (piece.reviewer_id !== user.id) return { error: 'Forbidden', status: 403 };
	if (piece.status !== 'korrektuuris') return { error: 'Conflict', status: 409 };
	if (!piece.pdf_url) return { error: 'Piece has no PDF', status: 409 };

	const existing = await db
		.prepare(`SELECT id FROM reviews WHERE piece_id = ? AND status = 'in_progress'`)
		.bind(pieceId)
		.first<{ id: string }>();

	if (existing) return { error: 'Review already in progress', status: 409 };

	const id = crypto.randomUUID();

	const latestRedaction = await db
		.prepare('SELECT id FROM piece_redactions WHERE piece_id = ? ORDER BY created_at DESC LIMIT 1')
		.bind(pieceId)
		.first<{ id: string }>();

	await db
		.prepare(
			'INSERT INTO reviews (id, piece_id, reviewer, status, pdf_url, redaction_id) VALUES (?, ?, ?, ?, ?, ?)'
		)
		.bind(id, pieceId, user.id, 'in_progress', piece.pdf_url ?? null, latestRedaction?.id ?? null)
		.run();

	return { ok: true, id };
}
