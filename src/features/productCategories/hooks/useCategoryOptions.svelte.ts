// One-shot (NON-subscribed) category fetch for admin form selects and slug→name lookups.
// Call from a component's init. No realtime on purpose: category edits happen on the
// categories page, so navigating to a consumer remounts it and refetches — always fresh.

// SVELTEKIT IMPORTS
import { onMount } from 'svelte';
import { SvelteMap } from 'svelte/reactivity';

// LIBRARIES
import { api } from '@/convex/_generated/api';
import { useConvexClient } from 'convex-svelte';

export function useCategoryOptions() {
	const convex = useConvexClient();

	let categories = $state<{ slug: string; name: string }[]>([]);

	onMount(async () => {
		categories = await convex.query(
			api.tables.productCategories.queries.fetchCategoryOptions.fetchCategoryOptions,
			{}
		);
	});

	const options = $derived(categories.map((c) => ({ value: c.slug, label: c.name })));
	const nameBySlug = $derived(new SvelteMap(categories.map((c) => [c.slug, c.name])));

	return {
		get categories() {
			return categories;
		},
		/** Select options for the product forms (value = slug, label = display name). */
		get options() {
			return options;
		},
		/** Slug → display name, for showing names where rows store slugs. */
		get nameBySlug() {
			return nameBySlug;
		}
	};
}
