import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

const MAX_SIZE = 20 * 1024 * 1024; // 20MB

export const POST: RequestHandler = async ({ request, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const bucket = platform?.env.PDF_BUCKET;
	if (!bucket) return json({ error: 'Storage not available' }, { status: 503 });

	let formData: FormData;
	try {
		formData = await request.formData();
	} catch {
		return json({ error: 'Invalid form data' }, { status: 400 });
	}

	const file = formData.get('file');
	if (!file || !(file instanceof File)) {
		return json({ error: 'file field is required' }, { status: 400 });
	}

	if (file.type !== 'application/pdf') {
		return json({ error: 'Only PDF files are allowed' }, { status: 400 });
	}

	if (file.size > MAX_SIZE) {
		return json({ error: 'File too large (max 20MB)' }, { status: 400 });
	}

	const key = `${Date.now()}-${file.name}`;
	const arrayBuffer = await file.arrayBuffer();

	await bucket.put(key, arrayBuffer, {
		httpMetadata: { contentType: 'application/pdf' }
	});

	return json({ url: '/pdf/' + encodeURIComponent(key) });
};
