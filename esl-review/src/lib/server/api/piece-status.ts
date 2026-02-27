import type { DatabaseSync } from 'node:sqlite';
import type { User } from '$lib/server/auth';

export type UpdateStatusResult = { ok: true } | { error: string; status: number };

type Role = 'typesetter' | 'reviewer';

const TRANSITIONS: Record<string, Record<string, Role>> = {
	kontrollitud: { paranduses: 'typesetter', kinnitatud: 'typesetter' },
	paranduses: { kinnitatud: 'reviewer', korrektuuris: 'reviewer' },
	kinnitatud: { publitseeritud: 'typesetter' }
};

interface PieceRoleRow {
	typesetter_id: string | null;
	reviewer_id: string | null;
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

function checkTransition(
	piece: PieceRoleRow,
	newStatus: string,
	user: User
): UpdateStatusResult | null {
	const allowed = TRANSITIONS[piece.status];
	if (!allowed || !(newStatus in allowed)) {
		return { error: 'Invalid status transition', status: 409 };
	}
	const role = allowed[newStatus];
	if (role === 'typesetter' && piece.typesetter_id !== user.id) {
		return { error: 'Forbidden', status: 403 };
	}
	if (role === 'reviewer' && piece.reviewer_id !== user.id) {
		return { error: 'Forbidden', status: 403 };
	}
	return null;
}

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function updatePieceStatus(
	db: DatabaseSync,
	pieceId: string,
	newStatus: string,
	user: User
): UpdateStatusResult {
	const piece = db
		.prepare('SELECT typesetter_id, reviewer_id, status FROM pieces WHERE id = ?')
		.get(pieceId) as unknown as PieceRoleRow | undefined;

	if (!piece) return { error: 'Not found', status: 404 };

	const err = checkTransition(piece, newStatus, user);
	if (err) return err;

	db.prepare(
		`UPDATE pieces SET status = ?, updated_at = datetime('now') WHERE id = ?`
	).run(newStatus, pieceId);

	return { ok: true };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function updatePieceStatusD1(
	db: D1Db,
	pieceId: string,
	newStatus: string,
	user: User
): Promise<UpdateStatusResult> {
	const piece = await db
		.prepare('SELECT typesetter_id, reviewer_id, status FROM pieces WHERE id = ?')
		.bind(pieceId)
		.first<PieceRoleRow>();

	if (!piece) return { error: 'Not found', status: 404 };

	const err = checkTransition(piece, newStatus, user);
	if (err) return err;

	await db
		.prepare(`UPDATE pieces SET status = ?, updated_at = datetime('now') WHERE id = ?`)
		.bind(newStatus, pieceId)
		.run();

	return { ok: true };
}
