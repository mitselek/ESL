import type { DatabaseSync } from 'node:sqlite';
import type { User } from '$lib/server/auth';

export type AssignReviewerResult = { ok: true } | { error: string; status: number };

interface PieceStatusRow {
	typesetter_id: string | null;
	status: string;
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
export function assignReviewer(
	db: DatabaseSync,
	pieceId: string,
	reviewerId: string,
	pdfUrl: string,
	pageflowMatched: boolean | undefined,
	user: User
): AssignReviewerResult {
	if (!pdfUrl) return { error: 'pdf_url is required', status: 400 };

	const piece = db
		.prepare('SELECT typesetter_id, status FROM pieces WHERE id = ?')
		.get(pieceId) as unknown as PieceStatusRow | undefined;

	if (!piece) return { error: 'Not found', status: 404 };
	if (piece.typesetter_id !== user.id) return { error: 'Forbidden', status: 403 };
	if (piece.status !== 'küljenduses') return { error: 'Conflict', status: 409 };

	const reviewer = db
		.prepare('SELECT id FROM users WHERE id = ?')
		.get(reviewerId) as unknown as { id: string } | undefined;

	if (!reviewer) return { error: 'Reviewer not found', status: 400 };

	db.prepare(
		`UPDATE pieces SET reviewer_id = ?, pdf_url = ?, pageflow_matched = ?, status = 'korrektuuris', updated_at = datetime('now') WHERE id = ?`
	).run(reviewerId, pdfUrl, pageflowMatched ? 1 : 0, pieceId);

	return { ok: true };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function assignReviewerD1(
	db: D1Db,
	pieceId: string,
	reviewerId: string,
	pdfUrl: string,
	pageflowMatched: boolean | undefined,
	user: User
): Promise<AssignReviewerResult> {
	if (!pdfUrl) return { error: 'pdf_url is required', status: 400 };

	const piece = await db
		.prepare('SELECT typesetter_id, status FROM pieces WHERE id = ?')
		.bind(pieceId)
		.first<PieceStatusRow>();

	if (!piece) return { error: 'Not found', status: 404 };
	if (piece.typesetter_id !== user.id) return { error: 'Forbidden', status: 403 };
	if (piece.status !== 'küljenduses') return { error: 'Conflict', status: 409 };

	const reviewer = await db
		.prepare('SELECT id FROM users WHERE id = ?')
		.bind(reviewerId)
		.first<{ id: string }>();

	if (!reviewer) return { error: 'Reviewer not found', status: 400 };

	await db
		.prepare(
			`UPDATE pieces SET reviewer_id = ?, pdf_url = ?, pageflow_matched = ?, status = 'korrektuuris', updated_at = datetime('now') WHERE id = ?`
		)
		.bind(reviewerId, pdfUrl, pageflowMatched ? 1 : 0, pieceId)
		.run();

	return { ok: true };
}
