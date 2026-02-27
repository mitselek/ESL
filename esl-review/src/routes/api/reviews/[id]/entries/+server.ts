import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { upsertReviewEntriesD1, type EntryInput } from '$lib/server/api/review-entries';

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
	if (!Array.isArray(body?.entries)) {
		return json({ error: 'entries must be an array' }, { status: 400 });
	}
	const entries = body.entries as unknown[];
	if (!entries.every(e => e && typeof e === 'object' && typeof (e as Record<string, unknown>).param_id === 'string')) {
		return json({ error: 'Each entry must have a string param_id' }, { status: 400 });
	}

	const result = await upsertReviewEntriesD1(db, params.id, entries as EntryInput[], locals.user);
	if ('error' in result) return json({ error: result.error }, { status: result.status });

	return json({ ok: true });
};
