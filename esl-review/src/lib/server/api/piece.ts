import type { DatabaseSync } from 'node:sqlite';

export interface VoicePart {
	id: string;
	name: string;
	sort_order: number;
}

export interface PieceParam {
	id: string;
	template_id: string;
	param_name: string;
	scope: string;
	sort_order: number;
	is_active: number;
}

export interface PieceDetail {
	id: string;
	title: string;
	composer: string | null;
	origin: string | null;
	section: string;
	status: string;
	pdf_url: string | null;
	source_pdf_url: string | null;
	pageflow_matched: number;
	notes: string | null;
	typesetter: { id: string; name: string | null } | null;
	reviewer: { id: string; name: string | null } | null;
	created_at: string;
	updated_at: string;
	voice_parts: VoicePart[];
	piece_params: PieceParam[];
}

interface PieceRow {
	id: string;
	title: string;
	composer: string | null;
	origin: string | null;
	section: string;
	status: string;
	pdf_url: string | null;
	source_pdf_url: string | null;
	pageflow_matched: number;
	notes: string | null;
	typesetter_id: string | null;
	typesetter_name: string | null;
	reviewer_id: string | null;
	reviewer_name: string | null;
	created_at: string;
	updated_at: string;
}

interface D1Db {
	prepare(query: string): {
		bind(...values: unknown[]): {
			first<T = Record<string, unknown>>(): Promise<T | null>;
			all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
		};
	};
}

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function getPiece(db: DatabaseSync, id: string): PieceDetail | null {
	const row = db
		.prepare(
			`SELECT p.id, p.title, p.composer, p.origin, p.section, p.status,
              p.pdf_url, p.source_pdf_url, p.pageflow_matched, p.notes, p.created_at, p.updated_at,
              t.id AS typesetter_id, t.name AS typesetter_name,
              r.id AS reviewer_id,   r.name AS reviewer_name
       FROM pieces p
       LEFT JOIN users t ON p.typesetter_id = t.id
       LEFT JOIN users r ON p.reviewer_id   = r.id
       WHERE p.id = ?`
		)
		.get(id) as unknown as PieceRow | undefined;

	if (!row) return null;

	const voice_parts = db
		.prepare('SELECT id, name, sort_order FROM voice_parts WHERE piece_id = ? ORDER BY sort_order ASC')
		.all(id) as unknown as VoicePart[];

	const piece_params = db
		.prepare(
			`SELECT pp.id, pp.template_id, pt.name AS param_name, pt.scope,
              pp.sort_order, pp.is_active
       FROM piece_params pp
       JOIN param_templates pt ON pp.template_id = pt.id
       WHERE pp.piece_id = ?
       ORDER BY pp.sort_order ASC`
		)
		.all(id) as unknown as PieceParam[];

	return {
		id: row.id,
		title: row.title,
		composer: row.composer,
		origin: row.origin,
		section: row.section,
		status: row.status,
		pdf_url: row.pdf_url,
		source_pdf_url: row.source_pdf_url,
		pageflow_matched: row.pageflow_matched,
		notes: row.notes,
		typesetter: row.typesetter_id ? { id: row.typesetter_id, name: row.typesetter_name } : null,
		reviewer: row.reviewer_id ? { id: row.reviewer_id, name: row.reviewer_name } : null,
		created_at: row.created_at,
		updated_at: row.updated_at,
		voice_parts,
		piece_params
	};
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function getPieceD1(db: D1Db, id: string): Promise<PieceDetail | null> {
	const row = await db
		.prepare(
			`SELECT p.id, p.title, p.composer, p.origin, p.section, p.status,
              p.pdf_url, p.source_pdf_url, p.pageflow_matched, p.notes, p.created_at, p.updated_at,
              t.id AS typesetter_id, t.name AS typesetter_name,
              r.id AS reviewer_id,   r.name AS reviewer_name
       FROM pieces p
       LEFT JOIN users t ON p.typesetter_id = t.id
       LEFT JOIN users r ON p.reviewer_id   = r.id
       WHERE p.id = ?`
		)
		.bind(id)
		.first<PieceRow>();

	if (!row) return null;

	const { results: voice_parts } = await db
		.prepare('SELECT id, name, sort_order FROM voice_parts WHERE piece_id = ? ORDER BY sort_order ASC')
		.bind(id)
		.all<VoicePart>();

	const { results: piece_params } = await db
		.prepare(
			`SELECT pp.id, pp.template_id, pt.name AS param_name, pt.scope,
              pp.sort_order, pp.is_active
       FROM piece_params pp
       JOIN param_templates pt ON pp.template_id = pt.id
       WHERE pp.piece_id = ?
       ORDER BY pp.sort_order ASC`
		)
		.bind(id)
		.all<PieceParam>();

	return {
		id: row.id,
		title: row.title,
		composer: row.composer,
		origin: row.origin,
		section: row.section,
		status: row.status,
		pdf_url: row.pdf_url,
		source_pdf_url: row.source_pdf_url,
		pageflow_matched: row.pageflow_matched,
		notes: row.notes,
		typesetter: row.typesetter_id ? { id: row.typesetter_id, name: row.typesetter_name } : null,
		reviewer: row.reviewer_id ? { id: row.reviewer_id, name: row.reviewer_name } : null,
		created_at: row.created_at,
		updated_at: row.updated_at,
		voice_parts,
		piece_params
	};
}
