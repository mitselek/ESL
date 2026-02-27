import type { LayoutServerLoad } from './$types';
import { getUser } from '$lib/server/auth';

export const load: LayoutServerLoad = async ({ request, platform, locals }) => {
	const jwt = request.headers.get('Cf-Access-Jwt-Assertion');
	const db = platform?.env.DB ?? null;

	locals.user = db ? await getUser(db, jwt) : null;

	return { user: locals.user };
};
