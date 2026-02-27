import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getReviewD1 } from '$lib/server/api/review-get';
import { completeReviewD1 } from '$lib/server/api/review-complete';

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const review = await getReviewD1(db, params.id);
	if (!review) return json({ error: 'Not found' }, { status: 404 });

	return json(review);
};

export const PUT: RequestHandler = async ({ params, locals, platform, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	let body: Record<string, unknown>;
	try {
		body = await request.json() as Record<string, unknown>;
	} catch {
		return json({ error: 'Invalid JSON' }, { status: 400 });
	}
	if (body?.status !== 'completed') {
		return json({ error: 'status must be "completed"' }, { status: 400 });
	}

	const result = await completeReviewD1(db, params.id, locals.user);
	if ('error' in result) return json({ error: result.error }, { status: result.status });

	return json({ ok: true });
};
