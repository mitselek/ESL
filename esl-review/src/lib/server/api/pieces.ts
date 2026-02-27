import type { DatabaseSync } from 'node:sqlite';

// Minimaalne D1Database interface (subset) — vältimaks @cloudflare/workers-types sõltuvust
interface D1PreparedStatement {
	bind(...values: unknown[]): D1PreparedStatement;
	all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
}
interface D1Db {
	prepare(query: string): D1PreparedStatement;
}

export interface Piece {
	id: string;
	title: string;
	composer: string | null;
	origin: string | null;
	section: string;
	status: string;
	pdf_url: string | null;
	notes: string | null;
	typesetter: { id: string; name: string | null } | null;
	reviewer: { id: string; name: string | null } | null;
	created_at: string;
	updated_at: string;
}

export interface PiecesQuery {
	status?: string;
	section?: string;
}

export interface PieceRow {
	id: string;
	title: string;
	composer: string | null;
	origin: string | null;
	section: string;
	status: string;
	pdf_url: string | null;
	notes: string | null;
	typesetter_id: string | null;
	typesetter_name: string | null;
	reviewer_id: string | null;
	reviewer_name: string | null;
	created_at: string;
	updated_at: string;
}

const SECTION_ORDER = ['I', 'II', 'III', 'IV'];

export const PIECES_SQL = `
  SELECT p.id, p.title, p.composer, p.origin, p.section, p.status,
         p.pdf_url, p.notes, p.created_at, p.updated_at,
         t.id   AS typesetter_id,   t.name AS typesetter_name,
         r.id   AS reviewer_id,     r.name AS reviewer_name
  FROM pieces p
  LEFT JOIN users t ON p.typesetter_id = t.id
  LEFT JOIN users r ON p.reviewer_id   = r.id
  WHERE (? IS NULL OR p.status  = ?)
    AND (? IS NULL OR p.section = ?)`;

export function mapPieceRows(rows: PieceRow[]): Piece[] {
	rows.sort((a, b) => {
		const si = SECTION_ORDER.indexOf(a.section) - SECTION_ORDER.indexOf(b.section);
		if (si !== 0) return si;
		return a.title.localeCompare(b.title, 'et');
	});

	return rows.map((row) => ({
		id: row.id,
		title: row.title,
		composer: row.composer,
		origin: row.origin,
		section: row.section,
		status: row.status,
		pdf_url: row.pdf_url,
		notes: row.notes,
		typesetter: row.typesetter_id ? { id: row.typesetter_id, name: row.typesetter_name } : null,
		reviewer: row.reviewer_id ? { id: row.reviewer_id, name: row.reviewer_name } : null,
		created_at: row.created_at,
		updated_at: row.updated_at
	}));
}

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function getPieces(db: DatabaseSync, query: PiecesQuery): Piece[] {
	const status = query.status ?? null;
	const section = query.section ?? null;

	const rows = db
		.prepare(PIECES_SQL)
		.all(status, status, section, section) as unknown as PieceRow[];

	return mapPieceRows(rows);
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function getPiecesD1(db: D1Db, query: PiecesQuery): Promise<Piece[]> {
	const status = query.status ?? null;
	const section = query.section ?? null;

	const { results } = await db
		.prepare(PIECES_SQL)
		.bind(status, status, section, section)
		.all<PieceRow>();

	return mapPieceRows(results);
}
