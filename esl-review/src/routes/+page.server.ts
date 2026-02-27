import { getPiecesD1 } from '$lib/server/api/pieces';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, locals }) => {
	const db = platform?.env.DB;
	const pieces = db ? await getPiecesD1(db, {}) : [];
	return { pieces, user: locals.user };
};
