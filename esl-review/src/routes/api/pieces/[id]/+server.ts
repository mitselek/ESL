import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPieceD1 } from '$lib/server/api/piece';

export const GET: RequestHandler = async ({ params, platform }) => {
	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const piece = await getPieceD1(db, params.id);
	if (!piece) return json({ error: 'Not found' }, { status: 404 });

	return json(piece);
};
