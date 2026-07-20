// SVELTEKIT IMPORTS
import { redirect } from '@sveltejs/kit';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

// UTILS

// TYPES
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	// Reuse the user the root layout already fetched in `+layout.server.ts`.
	const { currentUser } = await event.parent();

	if (!currentUser) {
		throw redirect(302, UNPROTECTED_PAGE_ENDPOINTS.LOGIN);
	}

	if ((currentUser as { role?: string }).role !== 'admin') {
		throw redirect(302, UNPROTECTED_PAGE_ENDPOINTS.ROOT);
	}

	return { currentUser };
};
