import { error } from '@sveltejs/kit';
import { getPieceD1 } from '$lib/server/api/piece';
import { getReviewD1 } from '$lib/server/api/review-get';
import { getUsersD1 } from '$lib/server/api/users';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform, locals }) => {
	const db = platform?.env.DB;
	if (!db) error(503, 'Database not available');

	const piece = await getPieceD1(db, params.id);
	if (!piece) error(404, 'Noot ei leitud');

	const user = locals.user;
	const isTypesetter = user && piece.typesetter?.id === user.id;
	const isReviewer = user && piece.reviewer?.id === user.id;

	// Aktiivne review korrektori jaoks (in_progress)
	let activeReview = null;
	if (isReviewer && piece.status === 'korrektuuris') {
		const row = await db
			.prepare("SELECT id FROM reviews WHERE piece_id = ? AND status = 'in_progress' LIMIT 1")
			.bind(params.id)
			.first<{ id: string }>();
		if (row) activeReview = await getReviewD1(db, row.id);
	}

	// Kõik lõpetatud review'd (seotud redaktsioonidega)
	const { results: completedRows } = await db
		.prepare("SELECT id FROM reviews WHERE piece_id = ? AND status = 'completed' ORDER BY created_at ASC")
		.bind(params.id)
		.all<{ id: string }>();
	const completedReviews = await Promise.all(
		completedRows.map(row => getReviewD1(db, row.id))
	);

	// Kasutajate nimekiri korrektori määramiseks
	let users: { id: string; name: string | null }[] = [];
	if (isTypesetter && piece.status === 'küljenduses') {
		users = (await getUsersD1(db, user)) ?? [];
	}

	return { piece, activeReview, completedReviews, users, user };
};
