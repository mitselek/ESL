import { json } from '@sveltejs/kit';
import type { User } from '$lib/server/auth';

export function getMeResponse(user: User | null): Response {
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });
	return json({ id: user.id, email: user.email, name: user.name, picture: user.picture });
}
