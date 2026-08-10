<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import { SearchInputConvex } from '@/components/ui/search-input/index.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let {
		productSlug = $bindable(''),
		productLabel = $bindable('')
	}: {
		productSlug?: string;
		productLabel?: string;
	} = $props();
</script>

<!-- One-shot search (SearchInputConvex uses `client.query`, not a subscription — see
     GeneralSystemDesignRule.md). Debounce + race-guard live in the shared component. -->
<SearchInputConvex
	query={api.tables.products.queries.fetchProductsForSearch.fetchProductsForSearch}
	mapItem={(p: Doc<'products'>) => ({ id: p.slug, title: p.name, imageUrl: p.images[0] })}
	minQueryLength={2}
	placeholder="Busca el producto..."
	class="mt-1 max-w-none"
	onSelect={(item) => {
		productSlug = item.id;
		productLabel = item.title;
	}}
/>
