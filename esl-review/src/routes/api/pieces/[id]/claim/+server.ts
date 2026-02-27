import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { claimPieceD1 } from '$lib/server/api/claim';

export const PUT: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const result = await claimPieceD1(db, params.id, locals.user);
	if ('error' in result) return json({ error: result.error }, { status: result.status });

	return json({ ok: true });
};
