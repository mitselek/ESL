import type { RequestHandler } from './$types';
import { json } from '@sveltejs/kit';

export const GET: RequestHandler = async ({ params, platform }) => {
	const bucket = platform?.env.PDF_BUCKET;
	if (!bucket) return json({ error: 'Storage not available' }, { status: 503 });

	const key = params.path;
	const obj = await bucket.get(key);

	if (!obj) {
		return new Response('Not found', { status: 404 });
	}

	return new Response(obj.body, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': 'inline'
		}
	});
};
