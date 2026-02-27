/**
 * GET /api/me handler test — TDD red phase
 *
 * Testib getMeResponse() funktsiooni otse.
 * Ei vaja DB-d — testib ainult Response objekti kuju.
 *
 * Praegu KUKUB LÄBI — src/lib/server/api/me.ts pole veel loodud.
 */
import { describe, it, expect } from 'vitest';
import { getMeResponse } from './me.js';
import type { User } from '../auth.js';

const TEST_USER: User = {
	id: 'user-123',
	email: 'test@example.com',
	name: 'Test User',
	picture: 'https://example.com/pic.jpg'
};

describe('GET /api/me', () => {
	it('user=null → 401 vastus', async () => {
		const response = getMeResponse(null);
		expect(response.status).toBe(401);
	});

	it('user=null → 401 body sisaldab {error: "Unauthorized"}', async () => {
		const response = getMeResponse(null);
		const body = await response.json() as Record<string, unknown>;
		expect(body).toHaveProperty('error', 'Unauthorized');
	});

	it('sisselogitud → 200 vastus', async () => {
		const response = getMeResponse(TEST_USER);
		expect(response.status).toBe(200);
	});

	it('sisselogitud → body sisaldab {id, email, name, picture}', async () => {
		const response = getMeResponse(TEST_USER);
		const body = await response.json() as Record<string, unknown>;
		expect(body.id).toBe('user-123');
		expect(body.email).toBe('test@example.com');
		expect(body.name).toBe('Test User');
		expect(body.picture).toBe('https://example.com/pic.jpg');
	});

	it('tagastatav objekt sisaldab AINULT {id, email, name, picture}', async () => {
		const response = getMeResponse(TEST_USER);
		const body = await response.json() as Record<string, unknown>;
		const keys = Object.keys(body);
		expect(keys).toHaveLength(4);
		expect(keys).toContain('id');
		expect(keys).toContain('email');
		expect(keys).toContain('name');
		expect(keys).toContain('picture');
	});

	it('name=null on lubatud', async () => {
		const user: User = { ...TEST_USER, name: null };
		const response = getMeResponse(user);
		expect(response.status).toBe(200);
		const body = await response.json() as Record<string, unknown>;
		expect(body.name).toBeNull();
	});

	it('picture=null on lubatud', async () => {
		const user: User = { ...TEST_USER, picture: null };
		const response = getMeResponse(user);
		expect(response.status).toBe(200);
		const body = await response.json() as Record<string, unknown>;
		expect(body.picture).toBeNull();
	});
});
