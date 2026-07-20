// Centralized store for product categories (sourced from `fetchAllCategories` via the
// admin layout's single `useQuery`). Components read `productCategoriesClass` instead of
// subscribing themselves — one page, one subscription (same pattern as `authClass`).

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

class ProductCategoriesClass {
	categories = $state<Doc<'productCategories'>[]>([]);

	/** True until the layout's query has synced at least once. */
	loading = $state(true);

	error = $state<Error | undefined>(undefined);

	/** Select options for the product forms (value = slug, label = display name). */
	options = $derived(this.categories.map((c) => ({ value: c.slug, label: c.name })));

	/** Slug → display name, for showing names where rows store slugs (e.g. products table). */
	nameBySlug = $derived(new Map(this.categories.map((c) => [c.slug, c.name])));

	/** Call from the admin layout's `useQuery` effect so all consumers share one subscription. */
	syncFromCategoriesQuery(
		categories: Doc<'productCategories'>[] | undefined,
		loading: boolean,
		error: Error | undefined
	) {
		this.categories = categories ?? [];
		this.loading = loading;
		this.error = error;
	}
}

export const productCategoriesClass = new ProductCategoriesClass();
