import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { getUsersD1 } from '$lib/server/api/users';

export const GET: RequestHandler = async ({ locals, platform }) => {
	if (!locals.user) return json({ error: 'Unauthorized' }, { status: 401 });

	const db = platform?.env.DB;
	if (!db) return json({ error: 'Database not available' }, { status: 503 });

	const users = await getUsersD1(db, locals.user);
	return json(users);
};
