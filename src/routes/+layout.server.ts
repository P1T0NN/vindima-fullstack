// LIBRARIES
import { PUBLIC_CONVEX_URL } from '$env/static/public';
import { api } from '@/convex/_generated/api';
import { getAuthState } from '@mmailaender/convex-better-auth-svelte/sveltekit';
import { createConvexHttpClient } from 'convex-svelte/sveltekit';

// TYPES
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async () => {
	const authState = getAuthState();

	if (!authState.isAuthenticated) {
		return { authState, currentUser: null };
	}

	const client = createConvexHttpClient({ url: PUBLIC_CONVEX_URL });

	try {
		const currentUser = await client.query(api.auth.getCurrentUser, {});
		return { authState, currentUser };
	} catch {
		return { authState, currentUser: null };
	}
};
