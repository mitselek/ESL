import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getMeResponse } from '$lib/server/api/me';

export const GET: RequestHandler = async ({ locals }) => getMeResponse(locals.user);

export const PUT: RequestHandler = async ({ locals, request, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });
	const db = platform?.env.DB;
	if (!db) return json({ error: 'No database' }, { status: 503 });
	const { name } = await request.json();
	if (!name || typeof name !== 'string' || !name.trim()) {
		return json({ error: 'Nimi on kohustuslik' }, { status: 400 });
	}
	await db.prepare('UPDATE users SET name = ? WHERE id = ?')
		.bind(name.trim(), locals.user.id)
		.run();
	return json({ ok: true });
};
