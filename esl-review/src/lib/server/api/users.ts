import type { DatabaseSync } from 'node:sqlite';
import type { User } from '$lib/server/auth';

export interface UserListItem {
	id: string;
	name: string | null;
}

interface D1Db {
	prepare(query: string): {
		all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
	};
}

const USERS_SQL = 'SELECT id, name FROM users ORDER BY name ASC';

// node:sqlite (sünkroonne) — kasutatakse unit testides
export function getUsers(db: DatabaseSync, user: User | null): UserListItem[] | null {
	if (!user) return null;

	return db.prepare(USERS_SQL).all() as unknown as UserListItem[];
}

// D1Database (asünkroonne) — kasutatakse SvelteKit route'is
export async function getUsersD1(db: D1Db, user: User | null): Promise<UserListItem[] | null> {
	if (!user) return null;

	const { results } = await db.prepare(USERS_SQL).all<UserListItem>();
	return results;
}
