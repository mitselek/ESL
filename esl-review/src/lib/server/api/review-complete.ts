import type { DatabaseSync } from 'node:sqlite';
import type { User } from '$lib/server/auth';

export type CompleteReviewResult = { ok: true } | { error: string; status: number };

interface ReviewStatusRow {
	id: string;
	piece_id: string;
	reviewer: string;
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
export function completeReview(
	db: DatabaseSync,
	reviewId: string,
	user: User
): CompleteReviewResult {
	const review = db
		.prepare('SELECT id, piece_id, reviewer, status FROM reviews WHERE id = ?')
		.get(reviewId) as unknown as ReviewStatusRow | undefined;

	if (!review) return { error: 'Not found', status: 404 };
	if (review.reviewer !== user.id) return { error: 'Forbidden', status: 403 };
	if (review.status !== 'in_progress') return { error: 'Conflict', status: 409 };

	db.prepare(`UPDATE reviews SET status = 'completed', updated_at = datetime('now') WHERE id = ?`)
		.run(reviewId);
	db.prepare(`UPDATE pieces SET status = 'kontrollitud', updated_at = datetime('now') WHERE id = ?`)
		.run(review.piece_id);

	return { ok: true };
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function completeReviewD1(
	db: D1Db,
	reviewId: string,
	user: User
): Promise<CompleteReviewResult> {
	const review = await db
		.prepare('SELECT id, piece_id, reviewer, status FROM reviews WHERE id = ?')
		.bind(reviewId)
		.first<ReviewStatusRow>();

	if (!review) return { error: 'Not found', status: 404 };
	if (review.reviewer !== user.id) return { error: 'Forbidden', status: 403 };
	if (review.status !== 'in_progress') return { error: 'Conflict', status: 409 };

	await db
		.prepare(`UPDATE reviews SET status = 'completed', updated_at = datetime('now') WHERE id = ?`)
		.bind(reviewId)
		.run();
	await db
		.prepare(`UPDATE pieces SET status = 'kontrollitud', updated_at = datetime('now') WHERE id = ?`)
		.bind(review.piece_id)
		.run();

	return { ok: true };
}
