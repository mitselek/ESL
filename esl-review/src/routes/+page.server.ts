import { getPiecesD1 } from '$lib/server/api/pieces';
import type { PageServerLoad } from './$types';

export interface ReviewProblem {
	param_name: string;
	verdict: string;
	remarks: string | null;
	voice_name: string | null;
}

interface ReviewProblemRow {
	piece_id: string;
	param_name: string;
	verdict: string;
	remarks: string | null;
	voice_name: string | null;
}

function parseRemarks(raw: string | null): string | null {
	const parsed = JSON.parse(raw ?? 'null');
	if (Array.isArray(parsed)) {
		const texts = parsed.map((r: { text: string }) => r.text).filter(Boolean);
		return texts.length > 0 ? texts.join('; ') : null;
	}
	return parsed ? String(parsed) : null;
}

export const load: PageServerLoad = async ({ platform, locals }) => {
	const db = platform?.env.DB;
	const pieces = db ? await getPiecesD1(db, {}) : [];

	if (!db) {
		return { pieces, user: locals.user, reviewProblems: {} as Record<string, ReviewProblem[]> };
	}

	const { results: rows } = await db
		.prepare(
			`SELECT r.piece_id, pt.name AS param_name, re.verdict,
				re.remarks, vp.name AS voice_name
			FROM reviews r
			JOIN review_entries re ON re.review_id = r.id
			JOIN piece_params pp ON pp.id = re.param_id
			JOIN param_templates pt ON pt.id = pp.template_id
			LEFT JOIN voice_parts vp ON vp.id = re.voice_part_id
			WHERE r.status = 'completed'
				AND re.verdict IN ('viga', 'ettepanek')
				AND r.created_at = (
					SELECT MAX(r2.created_at) FROM reviews r2
					WHERE r2.piece_id = r.piece_id AND r2.status = 'completed'
				)
			ORDER BY r.piece_id, pp.sort_order, re.voice_part_id`
		)
		.bind()
		.all<ReviewProblemRow>();

	const reviewProblems: Record<string, ReviewProblem[]> = {};
	for (const row of rows) {
		const problem: ReviewProblem = {
			param_name: row.param_name,
			verdict: row.verdict,
			remarks: parseRemarks(row.remarks),
			voice_name: row.voice_name
		};
		if (!reviewProblems[row.piece_id]) {
			reviewProblems[row.piece_id] = [];
		}
		reviewProblems[row.piece_id].push(problem);
	}

	return { pieces, user: locals.user, reviewProblems };
};
