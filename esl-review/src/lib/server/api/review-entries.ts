import type { DatabaseSync } from 'node:sqlite';
import type { User } from '$lib/server/auth';

export interface EntryInput {
	param_id: string;
	voice_part_id: string | null;
	remarks: unknown;
	verdict: string | null;
}

export type UpsertEntriesResult = { ok: true } | { error: string; status: number };

interface ReviewOwnerRow {
	reviewer: string;
	status: string;
}

interface D1PreparedBound {
	first<T = Record<string, unknown>>(): Promise<T | null>;
	run(): Promise<unknown>;
}

interface D1Prepared {
	bind(...values: unknown[]): D1PreparedBound;
}

interface D1Db {
	prepare(query: string): D1Prepared;
	batch(statements: D1PreparedBound[]): Promise<unknown[]>;
}

const INSERT_SQL =
	'INSERT INTO review_entries (id, review_id, param_id, voice_part_id, remarks, verdict) VALUES (?, ?, ?, ?, ?, ?)';

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function upsertReviewEntries(
	db: DatabaseSync,
	reviewId: string,
	entries: EntryInput[],
	user: User
): UpsertEntriesResult {
	const review = db
		.prepare('SELECT reviewer, status FROM reviews WHERE id = ?')
		.get(reviewId) as unknown as ReviewOwnerRow | undefined;

	if (!review) return { error: 'Not found', status: 404 };
	if (review.reviewer !== user.id) return { error: 'Forbidden', status: 403 };
	if (review.status !== 'in_progress') return { error: 'Conflict', status: 409 };

	db.prepare('DELETE FROM review_entries WHERE review_id = ?').run(reviewId);

	for (const entry of entries) {
		db.prepare(INSERT_SQL).run(
			crypto.randomUUID(),
			reviewId,
			entry.param_id,
			entry.voice_part_id ?? null,
			JSON.stringify(entry.remarks ?? null),
			entry.verdict ?? null
		);
	}

	return { ok: true };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function upsertReviewEntriesD1(
	db: D1Db,
	reviewId: string,
	entries: EntryInput[],
	user: User
): Promise<UpsertEntriesResult> {
	const review = await db
		.prepare('SELECT reviewer, status FROM reviews WHERE id = ?')
		.bind(reviewId)
		.first<ReviewOwnerRow>();

	if (!review) return { error: 'Not found', status: 404 };
	if (review.reviewer !== user.id) return { error: 'Forbidden', status: 403 };
	if (review.status !== 'in_progress') return { error: 'Conflict', status: 409 };

	const deleteStmt = db
		.prepare('DELETE FROM review_entries WHERE review_id = ?')
		.bind(reviewId);

	const insertStmts = entries.map((entry) =>
		db
			.prepare(INSERT_SQL)
			.bind(
				crypto.randomUUID(),
				reviewId,
				entry.param_id,
				entry.voice_part_id ?? null,
				JSON.stringify(entry.remarks ?? null),
				entry.verdict ?? null
			)
	);

	await db.batch([deleteStmt, ...insertStmts]);

	return { ok: true };
}
