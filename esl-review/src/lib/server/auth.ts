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

	if (existing) {
		// Uuenda ainult picture JWT-st, ära kirjuta üle kasutaja enda seatud nime
		await db
			.prepare('UPDATE users SET picture = ? WHERE id = ?')
			.bind(picture, existing.id)
			.run();
		const row = await db
			.prepare('SELECT id, email, name, picture FROM users WHERE id = ?')
			.bind(existing.id)
			.first<User>();
		return row ?? null;
	}

	await db
		.prepare('INSERT INTO users (id, email, name, picture) VALUES (?, ?, ?, ?)')
		.bind(id, email, name, picture)
		.run();

	return { id, email, name, picture };
}
