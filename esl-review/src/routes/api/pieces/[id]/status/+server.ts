import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { updatePieceStatusD1 } from '$lib/server/api/piece-status';

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
	const newStatus = body?.status;
	if (!newStatus || typeof newStatus !== 'string') {
		return json({ error: 'status is required' }, { status: 400 });
	}

	const pdfUrl = typeof body.pdf_url === 'string' ? body.pdf_url : undefined;
	const result = await updatePieceStatusD1(db, params.id, newStatus, locals.user, pdfUrl);
	if ('error' in result) return json({ error: result.error }, { status: result.status });

	return json({ ok: true });
};
