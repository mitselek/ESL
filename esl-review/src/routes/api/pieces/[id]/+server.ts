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

export const PATCH: RequestHandler = async ({ params, locals, platform, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const body = await request.json();
	const { composer } = body;

	if (typeof composer !== 'string' || !composer.trim()) {
		return json({ error: 'composer is required' }, { status: 400 });
	}

	await db.prepare('UPDATE pieces SET composer = ? WHERE id = ?').bind(composer.trim(), params.id).run();

	return json({ ok: true });
};
