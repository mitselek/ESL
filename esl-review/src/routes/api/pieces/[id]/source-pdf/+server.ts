import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { setSourcePdfD1 } from '$lib/server/api/set-source-pdf';

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

	const sourcePdfUrl = body?.source_pdf_url;
	if (!sourcePdfUrl || typeof sourcePdfUrl !== 'string') {
		return json({ error: 'source_pdf_url is required' }, { status: 400 });
	}

	const result = await setSourcePdfD1(db, params.id, sourcePdfUrl);
	if ('error' in result) return json({ error: result.error }, { status: result.status });

	return json({ ok: true });
};
