export interface User {
	id: string;
	email: string;
	name: string | null;
	picture: string | null;
}

interface JwtPayload {
	email?: string;
	name?: string;
	picture?: string;
}

function decodeJwtPayload(jwt: string): JwtPayload | null {
	try {
		const parts = jwt.split('.');
		if (parts.length !== 3) return null;
		const payload = parts[1].replace(/-/g, '+').replace(/_/g, '/');
		const decoded = atob(payload);
		return JSON.parse(decoded) as JwtPayload;
	} catch {
		return null;
	}
}

interface D1Db {
	prepare(query: string): {
		bind(...values: unknown[]): {
			first<T = Record<string, unknown>>(): Promise<T | null>;
			run(): Promise<unknown>;
		};
	};
}

export async function getUser(db: D1Db, jwtHeader: string | null): Promise<User | null> {
	if (!jwtHeader) return null;

	const payload = decodeJwtPayload(jwtHeader);
	if (!payload?.email) return null;

	const email = payload.email;
	const name = payload.name ?? null;
	const picture = payload.picture ?? null;

	const existing = await db
		.prepare('SELECT id FROM users WHERE email = ?')
		.bind(email)
		.first<{ id: string }>();

	const id = existing?.id ?? crypto.randomUUID();

	await db
		.prepare(
			'INSERT OR REPLACE INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)'
		)
		.bind(id, email, name, picture)
		.run();

	return { id, email, name, picture };
}
