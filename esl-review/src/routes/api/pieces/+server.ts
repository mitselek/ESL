import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getPiecesD1 } from '$lib/server/api/pieces';

export const GET: RequestHandler = async ({ platform, url }) => {
	const db = platform?.env.DB;
	if (!db) {
		return json({ error: 'Database not available' }, { status: 503 });
	}

	const pieces = await getPiecesD1(db, {
		status: url.searchParams.get('status') ?? undefined,
		section: url.searchParams.get('section') ?? undefined
	});

	return json(pieces);
};
