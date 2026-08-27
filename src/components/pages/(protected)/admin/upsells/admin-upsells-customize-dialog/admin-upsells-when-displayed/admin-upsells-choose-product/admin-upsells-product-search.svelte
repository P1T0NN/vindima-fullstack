<script lang="ts">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SearchInput from '@/features/search/components/search-input.svelte';

	// HOOKS
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';

	type SearchProduct = {
		_id: string;
		slug: string;
		name: string;
		images: string[];
	};

	let {
		productSlug = $bindable(''),
		productLabel = $bindable('')
	}: {
		productSlug?: string;
		productLabel?: string;
	} = $props();

	const search = useSearch();
	const productsQuery = useQuery(
		api.tables.products.queries.fetchProductsForSearch.fetchProductsForSearch,
		() => (search.isActive ? { search: search.term } : 'skip')
	);

	function selectProduct(product: SearchProduct) {
		productSlug = product.slug;
		productLabel = product.name;
		search.clear();
	}
</script>

<SearchInput
	bind:value={search.value}
	label="Buscar el producto"
	placeholder="Busca el producto..."
	dropdownOpen={search.isActive}
	class="mt-1 max-w-none"
>
	{#snippet dropdown()}
		{#if productsQuery.isLoading}
			<p class="px-3 py-2 text-sm text-muted-foreground" role="status">Buscando...</p>
		{:else if productsQuery.error}
			<p class="px-3 py-2 text-sm text-destructive" role="status">
				No se pudieron cargar los productos.
			</p>
		{:else if productsQuery.data?.length}
			{#each productsQuery.data as product (product._id)}
				<button
					type="button"
					role="option"
					aria-selected="false"
					class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
					onclick={() => selectProduct(product)}
				>
					<span class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
						{#if product.images[0]}
							<img src={product.images[0]} alt="" class="size-full object-cover" />
						{:else}
							<span class="text-xs font-semibold text-muted-foreground">
								{product.name.slice(0, 1).toUpperCase()}
							</span>
						{/if}
					</span>
					<span class="truncate font-medium">{product.name}</span>
				</button>
			{/each}
		{:else}
			<p class="px-3 py-2 text-sm text-muted-foreground" role="status">Sin resultados</p>
		{/if}
	{/snippet}
</SearchInput>
