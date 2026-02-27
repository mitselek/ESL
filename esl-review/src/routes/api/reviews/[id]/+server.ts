import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getReviewD1 } from '$lib/server/api/review-get';

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const review = await getReviewD1(db, params.id);
	if (!review) return json({ error: 'Not found' }, { status: 404 });

	return json(review);
};
