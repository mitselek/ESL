import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { addVoicePartD1 } from '$lib/server/api/voice-parts';

export const POST: RequestHandler = async ({ params, locals, platform, request }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const db = platform?.env.DB;
	if (!db) return json({ error: 'DB unavailable' }, { status: 503 });
	const { name } = await request.json();
	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'name is required' }, { status: 400 });
	}
	try {
		const result = await addVoicePartD1(db, params.id, name, locals.user);
		return json(result, { status: 201 });
	} catch (e: unknown) {
		const err = e as Error & { status?: number };
		return json({ error: err.message }, { status: err.status ?? 500 });
	}
};
