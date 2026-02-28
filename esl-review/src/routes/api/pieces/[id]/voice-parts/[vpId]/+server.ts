import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { deleteVoicePartD1 } from '$lib/server/api/voice-parts';

export const DELETE: RequestHandler = async ({ params, locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const db = platform?.env.DB;
	if (!db) return json({ error: 'DB unavailable' }, { status: 503 });
	try {
		await deleteVoicePartD1(db, params.id, params.vpId, locals.user);
		return json({ ok: true });
	} catch (e: unknown) {
		const err = e as Error & { status?: number };
		return json({ error: err.message }, { status: err.status ?? 500 });
	}
};
