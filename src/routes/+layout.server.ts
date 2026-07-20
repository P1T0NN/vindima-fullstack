// LIBRARIES
import { api } from '@/convex/_generated/api';
import {
	createConvexHttpClient,
	getAuthState
} from '@mmailaender/convex-better-auth-svelte/sveltekit';

// TYPES
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const authState = getAuthState();
	if (!authState.isAuthenticated) {
		return { authState, currentUser: null };
	}

	const client = createConvexHttpClient();
	try {
		const currentUser = await client.query(api.auth.queries.authQueries.getCurrentUser, {});
		return { authState, currentUser };
	} catch (error) {
		console.error('[+layout.server] getCurrentUser failed:', error);
		return { authState, currentUser: null };
	}
};
