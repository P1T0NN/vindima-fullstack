// LIBRARIES
import { error } from '@sveltejs/kit';
import { api } from '@/convex/_generated/api';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

// TYPES
import type { PageServerLoad } from './$types';

/**
 * Load the category for `/shop/[category]` server-side (SSR — good for SEO, and it's a
 * one-shot read, not a live subscription, so the page keeps its single `useQuery` for the
 * product grid). An unknown slug → 404. Static `/shop/<slug>` pages take precedence over this
 * route, so bespoke categories never reach here.
 */
export const load: PageServerLoad = async ({ params }) => {
	const client = createConvexHttpClient();
	const category = await client.query(
		api.tables.productCategories.queries.fetchCategoryBySlug.fetchCategoryBySlug,
		{ slug: params.category }
	);

	if (!category) {
		error(404, 'Categoría no encontrada');
	}

	return { category };
};
