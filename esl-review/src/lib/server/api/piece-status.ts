import type { DatabaseSync } from 'node:sqlite';
import type { User } from '$lib/server/auth';

export type UpdateStatusResult = { ok: true } | { error: string; status: number };

type Role = 'typesetter' | 'reviewer';

const TRANSITIONS: Record<string, Record<string, Role | Role[]>> = {
	kontrollitud: { paranduses: 'typesetter', kinnitatud: 'typesetter' },
	paranduses: { kinnitatud: 'reviewer', korrektuuris: ['typesetter', 'reviewer'] },
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
	const roles = Array.isArray(allowed[newStatus]) ? allowed[newStatus] : [allowed[newStatus]];
	const hasRole = roles.some((role) => {
		if (role === 'typesetter') return piece.typesetter_id === user.id;
		if (role === 'reviewer') return piece.reviewer_id === user.id;
		return false;
	});
	if (!hasRole) return { error: 'Forbidden', status: 403 };
	return null;
}

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function updatePieceStatus(
	db: DatabaseSync,
	pieceId: string,
	newStatus: string,
	user: User,
	pdfUrl?: string
): UpdateStatusResult {
	const piece = db
		.prepare('SELECT typesetter_id, reviewer_id, status FROM pieces WHERE id = ?')
		.get(pieceId) as unknown as PieceRoleRow | undefined;

	if (!piece) return { error: 'Not found', status: 404 };

	const err = checkTransition(piece, newStatus, user);
	if (err) return err;

	if (pdfUrl) {
		db.prepare(
			`UPDATE pieces SET status = ?, pdf_url = ?, updated_at = datetime('now') WHERE id = ?`
		).run(newStatus, pdfUrl, pieceId);
	} else {
		db.prepare(
			`UPDATE pieces SET status = ?, updated_at = datetime('now') WHERE id = ?`
		).run(newStatus, pieceId);
	}

	return { ok: true };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function updatePieceStatusD1(
	db: D1Db,
	pieceId: string,
	newStatus: string,
	user: User,
	pdfUrl?: string
): Promise<UpdateStatusResult> {
	const piece = await db
		.prepare('SELECT typesetter_id, reviewer_id, status FROM pieces WHERE id = ?')
		.bind(pieceId)
		.first<PieceRoleRow>();

	if (!piece) return { error: 'Not found', status: 404 };

	const err = checkTransition(piece, newStatus, user);
	if (err) return err;

	if (pdfUrl) {
		await db
			.prepare(`UPDATE pieces SET status = ?, pdf_url = ?, updated_at = datetime('now') WHERE id = ?`)
			.bind(newStatus, pdfUrl, pieceId)
			.run();
	} else {
		await db
			.prepare(`UPDATE pieces SET status = ?, updated_at = datetime('now') WHERE id = ?`)
			.bind(newStatus, pieceId)
			.run();
	}

	return { ok: true };
}
