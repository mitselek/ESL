import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { assignReviewerD1 } from '$lib/server/api/assign-reviewer';

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
	const reviewer_id = body?.reviewer_id;
	if (!reviewer_id || typeof reviewer_id !== 'string') {
		return json({ error: 'reviewer_id is required' }, { status: 400 });
	}

	const pdf_url = body?.pdf_url;
	if (!pdf_url || typeof pdf_url !== 'string') {
		return json({ error: 'pdf_url is required' }, { status: 400 });
	}

	const pageflow_matched = body?.pageflow_matched === true;

	const result = await assignReviewerD1(db, params.id, reviewer_id, pdf_url, pageflow_matched, locals.user);
	if ('error' in result) return json({ error: result.error }, { status: result.status });

	return json({ ok: true });
};
