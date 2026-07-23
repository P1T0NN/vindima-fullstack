// LIBRARIES
import { error } from '@sveltejs/kit';
import { api } from '@/convex/_generated/api';
import { createConvexHttpClient } from '@mmailaender/convex-better-auth-svelte/sveltekit';

// TYPES
import type { PageServerLoad } from './$types';

/**
 * Load the WHOLE `/shop/[category]` page in one query (`fetchCategoryPage`): category header
 * + all active products with variants. One-shot, no client subscription (see
 * docs/GeneralSystemDesignRule.md).
 *
 * Two delivery modes:
 * - Direct hits (crawlers, hard loads): AWAIT server-side → products in the initial HTML
 *   (SEO) and a real 404 status for unknown slugs.
 * - Client-side navigations (`isDataRequest`): return the un-awaited promise → SvelteKit
 *   streams it, navigation completes instantly, and the page's `<svelte:boundary>` shows
 *   its skeleton until the data lands.
 *
 * Static `/shop/<slug>` pages take precedence over this route, so bespoke categories never
 * reach here.
 */
export const load: PageServerLoad = async ({ params, isDataRequest }) => {
	const client = createConvexHttpClient();
	const pagePromise = client.query(
		api.tables.productCategories.queries.fetchCategoryPage.fetchCategoryPage,
		{ slug: params.category }
	);

	if (!isDataRequest) {
		const page = await pagePromise;
		if (!page) {
			error(404, 'Categoría no encontrada');
		}
		return { pageData: page };
	}

	return { pageData: pagePromise };
};
