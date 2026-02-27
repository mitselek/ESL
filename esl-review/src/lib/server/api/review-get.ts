import type { DatabaseSync } from 'node:sqlite';

export interface ReviewEntry {
	id: string;
	param_id: string;
	voice_part_id: string | null;
	remarks: unknown;
	verdict: string | null;
}

export interface ReviewDetail {
	id: string;
	piece_id: string;
	reviewer: string;
	status: string;
	pdf_url: string;
	created_at: string;
	entries: ReviewEntry[];
}

interface ReviewRow {
	id: string;
	piece_id: string;
	reviewer: string;
	status: string;
	pdf_url: string;
	created_at: string;
}

interface ReviewEntryRow {
	id: string;
	param_id: string;
	voice_part_id: string | null;
	remarks: string | null;
	verdict: string | null;
}

interface D1Db {
	prepare(query: string): {
		bind(...values: unknown[]): {
			first<T = Record<string, unknown>>(): Promise<T | null>;
			all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
		};
	};
}

function parseEntries(rows: ReviewEntryRow[]): ReviewEntry[] {
	return rows.map((row) => ({
		id: row.id,
		param_id: row.param_id,
		voice_part_id: row.voice_part_id,
		remarks: JSON.parse(row.remarks ?? 'null'),
		verdict: row.verdict
	}));
}

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function getReview(db: DatabaseSync, reviewId: string): ReviewDetail | null {
	const review = db
		.prepare('SELECT id, piece_id, reviewer, status, pdf_url, created_at FROM reviews WHERE id = ?')
		.get(reviewId) as unknown as ReviewRow | undefined;

	if (!review) return null;

	const entryRows = db
		.prepare(
			'SELECT id, param_id, voice_part_id, remarks, verdict FROM review_entries WHERE review_id = ? ORDER BY rowid ASC'
		)
		.all(reviewId) as unknown as ReviewEntryRow[];

	return { ...review, entries: parseEntries(entryRows) };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function getReviewD1(db: D1Db, reviewId: string): Promise<ReviewDetail | null> {
	const review = await db
		.prepare('SELECT id, piece_id, reviewer, status, pdf_url, created_at FROM reviews WHERE id = ?')
		.bind(reviewId)
		.first<ReviewRow>();

	if (!review) return null;

	const { results: entryRows } = await db
		.prepare(
			'SELECT id, param_id, voice_part_id, remarks, verdict FROM review_entries WHERE review_id = ? ORDER BY rowid ASC'
		)
		.bind(reviewId)
		.all<ReviewEntryRow>();

	return { ...review, entries: parseEntries(entryRows) };
}
