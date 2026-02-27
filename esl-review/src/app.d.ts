// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
import type { User } from '$lib/server/auth';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			user: User | null;
		}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env: {
				DB: D1Database;
			};
			context: ExecutionContext;
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
