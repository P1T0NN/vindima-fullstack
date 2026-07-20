// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { CurrentUser } from '@/features/auth/classes/authClass.svelte';

declare global {
	namespace App {
		// interface Error {}
		interface Locals {
			token: string | undefined;
		}
		interface PageData {
			/** Shown in app shells (e.g. `SiteHeader`) when set by a route `load`. */
			pageTitle?: string;
			/**
			 * Signed-in user, preloaded server-side by `+layout.server.ts` (`null` = signed out).
			 *
			 * Readable synchronously at component init — unlike `authClass.currentUser`, which the
			 * layout only populates once its sync effect runs (after mount). The trade: this is the
			 * initial-load snapshot and is NOT refetched on client-side navigation, so it goes stale
			 * after an in-app sign-in/out. Use `authClass` for live reads; use this for init-time
			 * defaults, falling back between the two.
			 */
			currentUser?: CurrentUser | null;
		}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
