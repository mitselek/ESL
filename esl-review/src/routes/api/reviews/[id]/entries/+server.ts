import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { upsertReviewEntriesD1 } from '$lib/server/api/review-entries';

export const PUT: RequestHandler = async ({ params, locals, platform, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const body = await request.json() as Record<string, unknown>;
	if (!Array.isArray(body?.entries)) {
		return json({ error: 'entries must be an array' }, { status: 400 });
	}

	const result = await upsertReviewEntriesD1(db, params.id, body.entries, locals.user);
	if ('error' in result) return json({ error: result.error }, { status: result.status });

	return json({ ok: true });
};
