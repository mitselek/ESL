import type { RequestHandler } from './$types';
import { getMeResponse } from '$lib/server/api/me';

export const GET: RequestHandler = async ({ locals }) => getMeResponse(locals.user);
