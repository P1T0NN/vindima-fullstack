<script lang="ts">
	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { CART_CONFIG } from '@/shared/features/cart/config.js';

	// COMPONENTS
	import SearchInput from '@/features/search/components/search-input.svelte';

	// HOOKS
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { formatVariantName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	type VariantSearchRow = {
		ref: string;
		productName: string;
		variantLabel: string | null;
		priceMinor: number;
		imageUrl: string | null;
	};

	let {
		excludeSlug = '',
		disabled = false,
		onAdd
	}: {
		/** Trigger product slug to drop — a product can't upsell itself. */
		excludeSlug?: string;
		/** True at the selection cap — blocks adding more. */
		disabled?: boolean;
		onAdd: (ref: string, label: string) => void;
	} = $props();

	const search = useSearch();
	const variantsQuery = useQuery(
		api.tables.productVariants.queries.fetchProductVariantsForSearch.fetchProductVariantsForSearch,
		() =>
			search.isActive ? { search: search.term, excludeSlug: excludeSlug || undefined } : 'skip'
	);

	const money = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);

	function selectVariant(row: VariantSearchRow) {
		const label = formatVariantName(row.productName, row.variantLabel);
		onAdd(row.ref, label);
		search.clear();
	}
</script>

<SearchInput
	bind:value={search.value}
	label="Buscar productos"
	placeholder="Buscar productos..."
	dropdownOpen={!disabled && search.isActive}
	{disabled}
	class="max-w-none"
>
	{#snippet dropdown()}
		{#if variantsQuery.isLoading}
			<p class="px-3 py-2 text-sm text-muted-foreground" role="status">Buscando...</p>
		{:else if variantsQuery.error}
			<p class="px-3 py-2 text-sm text-destructive" role="status">
				No se pudieron cargar los productos.
			</p>
		{:else if variantsQuery.data?.length}
			{#each variantsQuery.data as row (row.ref)}
				<button
					type="button"
					role="option"
					aria-selected="false"
					class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
					onclick={() => selectVariant(row)}
				>
					<span class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
						{#if row.imageUrl}
							<img src={row.imageUrl} alt="" class="size-full object-cover" />
						{:else}
							<span class="icon-[lucide--wine] size-4 text-muted-foreground" aria-hidden="true"
							></span>
						{/if}
					</span>
					<span class="min-w-0 flex-1 truncate font-medium">
						{formatVariantName(row.productName, row.variantLabel)}
					</span>
					<span class="shrink-0 text-muted-foreground tabular-nums">{money(row.priceMinor)}</span>
				</button>
			{/each}
		{:else}
			<p class="px-3 py-2 text-sm text-muted-foreground" role="status">Sin resultados</p>
		{/if}
	{/snippet}
</SearchInput>
