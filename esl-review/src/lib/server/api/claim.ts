import type { DatabaseSync } from 'node:sqlite';
import type { User } from '$lib/server/auth';

export type ClaimResult = { ok: true } | { error: string; status: number };

interface PieceClaimRow {
	typesetter_id: string | null;
	status: string;
}

const CLAIMABLE_STATUSES = ['teos', 'lähtefail'];

interface D1Db {
	prepare(query: string): {
		bind(...values: unknown[]): {
			first<T = Record<string, unknown>>(): Promise<T | null>;
			run(): Promise<unknown>;
		};
	};
}

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function claimPiece(db: DatabaseSync, pieceId: string, user: User): ClaimResult {
	const piece = db
		.prepare('SELECT typesetter_id, status FROM pieces WHERE id = ?')
		.get(pieceId) as unknown as PieceClaimRow | undefined;

	if (!piece) return { error: 'Not found', status: 404 };
	if (piece.typesetter_id) return { error: 'Already claimed', status: 409 };
	if (!CLAIMABLE_STATUSES.includes(piece.status)) return { error: 'Cannot claim in current status', status: 409 };

	db.prepare(`UPDATE pieces SET typesetter_id = ?, status = 'küljenduses', updated_at = datetime('now') WHERE id = ?`)
		.run(user.id, pieceId);

	return { ok: true };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function claimPieceD1(db: D1Db, pieceId: string, user: User): Promise<ClaimResult> {
	const piece = await db
		.prepare('SELECT typesetter_id, status FROM pieces WHERE id = ?')
		.bind(pieceId)
		.first<PieceClaimRow>();

	if (!piece) return { error: 'Not found', status: 404 };
	if (piece.typesetter_id) return { error: 'Already claimed', status: 409 };
	if (!CLAIMABLE_STATUSES.includes(piece.status)) return { error: 'Cannot claim in current status', status: 409 };

	await db
		.prepare(`UPDATE pieces SET typesetter_id = ?, status = 'küljenduses', updated_at = datetime('now') WHERE id = ?`)
		.bind(user.id, pieceId)
		.run();

	return { ok: true };
}
