import type { DatabaseSync } from 'node:sqlite';

export type SetSourcePdfResult = { ok: true } | { error: string; status: number };

interface PieceRow {
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
export function setSourcePdf(db: DatabaseSync, pieceId: string, sourcePdfUrl: string): SetSourcePdfResult {
	if (!sourcePdfUrl) return { error: 'source_pdf_url is required', status: 400 };

	const piece = db
		.prepare('SELECT status FROM pieces WHERE id = ?')
		.get(pieceId) as unknown as PieceRow | undefined;

	if (!piece) return { error: 'Not found', status: 404 };

	const newStatus = piece.status === 'teos' ? 'lähtefail' : piece.status;

	db.prepare(
		`UPDATE pieces SET source_pdf_url = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
	).run(sourcePdfUrl, newStatus, pieceId);

	return { ok: true };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function setSourcePdfD1(db: D1Db, pieceId: string, sourcePdfUrl: string): Promise<SetSourcePdfResult> {
	if (!sourcePdfUrl) return { error: 'source_pdf_url is required', status: 400 };

	const piece = await db
		.prepare('SELECT status FROM pieces WHERE id = ?')
		.bind(pieceId)
		.first<PieceRow>();

	if (!piece) return { error: 'Not found', status: 404 };

	const newStatus = piece.status === 'teos' ? 'lähtefail' : piece.status;

	await db
		.prepare(
			`UPDATE pieces SET source_pdf_url = ?, status = ?, updated_at = datetime('now') WHERE id = ?`
		)
		.bind(sourcePdfUrl, newStatus, pieceId)
		.run();

	return { ok: true };
}
