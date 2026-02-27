import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createReviewD1 } from '$lib/server/api/review-create';

export const POST: RequestHandler = async ({ locals, platform, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const body = await request.json() as Record<string, unknown>;
	const piece_id = body?.piece_id;
	if (!piece_id || typeof piece_id !== 'string') {
		return json({ error: 'piece_id is required' }, { status: 400 });
	}

	const result = await createReviewD1(db, piece_id, locals.user);
	if ('error' in result) return json({ error: result.error }, { status: result.status });

	return json({ ok: true, id: result.id });
};
