import { getUser } from '$lib/server/auth';
import type { Handle } from '@sveltejs/kit';

export const handle: Handle = async ({ event, resolve }) => {
	const jwt = event.request.headers.get('Cf-Access-Jwt-Assertion');
	const db = event.platform?.env.DB ?? null;
	event.locals.user = db ? await getUser(db, jwt) : null;
	return resolve(event);
};
