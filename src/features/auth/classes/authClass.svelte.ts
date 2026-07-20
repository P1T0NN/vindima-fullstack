// Centralized store for the currently-authenticated user (sourced from
// `api.auth.queries.authQueries.getCurrentUser` via the root layout's `useQuery`).
// Components should read from `authClass.currentUser` instead of subscribing to
// the query themselves.

// LIBRARIES
import { api } from '@/convex/_generated/api';

// TYPES
import type { FunctionReturnType } from 'convex/server';

/**
 * Derived from the Convex query's actual return type, so any change to
 * `getCurrentUser` (or to better-auth's `additionalFields`) flows through here
 * automatically — no risk of the local type drifting out of sync.
 */
export type CurrentUser = NonNullable<
	FunctionReturnType<typeof api.auth.queries.authQueries.getCurrentUser>
>;

class AuthClass {
	/** `undefined` = not yet synced; `null` = signed out; otherwise the user. */
	currentUser = $state<CurrentUser | null | undefined>(undefined);

	/** True while `getCurrentUser` is in flight (not skipped), or until layout sync runs. */
	userLoading = $state(true);

	/** Call from the layout `useQuery` effect so all consumers share one subscription. */
	syncFromCurrentUserQuery(user: CurrentUser | null | undefined, loading: boolean) {
		this.currentUser = user;
		this.userLoading = loading;
	}
}

export const authClass = new AuthClass();
