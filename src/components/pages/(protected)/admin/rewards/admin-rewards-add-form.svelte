<script lang="ts">
	// Add a reward item: search an addable product variant, pick it → it's set reward-eligible.

	// LIBRARIES
	import { useMutation, useQuery } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';

	// CONFIG
	import { CART_CONFIG } from '@/shared/features/cart/config';

	// COMPONENTS
	import SearchInput from '@/features/search/components/search-input.svelte';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// HOOKS
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { formatVariantName } from '@/shared/features/productVariants/utils/variantDisplayName.js';
	import { toastMessage } from '@/utils/toastMessage';
import { hasErrorMessage } from '@/shared/utils/errorMessage';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	type RewardProductSearchRow = {
		variantId: string;
		productName: string;
		variantLabel: string | null;
		priceMinor: number;
		imageUrl: string | null;
	};

	const setVariantRewardEligible = useMutation(
		api.tables.productVariants.mutations.setVariantRewardEligible.setVariantRewardEligible
	);
	const uid = $props.id();
	const hintId = `${uid}-hint`;

	const search = useSearch();
	const rewardProductsQuery = useQuery(
		api.tables.productVariants.queries.fetchRewardProducts.fetchRewardProducts,
		() => (search.isActive ? { search: search.term } : 'skip')
	);

	/** Variant currently being added — the dropdown row shows progress until the write lands. */
	let pendingId = $state<string | null>(null);

	const money = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);

	async function addReward(variantId: string) {
		if (pendingId) return;
		pendingId = variantId;
		try {
			let result;
			try {
				result = await setVariantRewardEligible({
					variantId: variantId as Id<'productVariants'>,
					eligible: true
				});
			} catch (error) {
				if (error instanceof ConvexError && hasErrorMessage(error.data)) {
					toastMessage({
						type: 'error',
						error,
						message: error.data.message
					});
				} else if (isRateLimitError(error)) {
					toastMessage({ type: 'error', error, message: '' });
				} else {
					throw error;
				}
				return;
			}
			const message = result.message;
			if (!result.success) {
				toastMessage({ type: 'error', error: null, message });
				return;
			}
			toastMessage({ type: 'success', message });
			search.clear();
		} finally {
			pendingId = null;
		}
	}
</script>

<div class="flex flex-col gap-2.5 rounded-xl border bg-card p-4">
	<h2 class="flex items-center gap-1.5 text-sm font-semibold">
		<span class="icon-[lucide--plus] size-4 text-muted-foreground" aria-hidden="true"></span>
		Añadir artículo de recompensa
	</h2>

	<SearchInput
		bind:value={search.value}
		label="Buscar un producto para añadir a las recompensas"
		placeholder="Busca un producto para añadir..."
		aria-describedby={hintId}
		dropdownOpen={search.isActive}
		class="max-w-lg"
	>
		{#snippet dropdown()}
			{#if rewardProductsQuery.isLoading}
				<p class="px-3 py-2 text-sm text-muted-foreground" role="status">Buscando...</p>
			{:else if rewardProductsQuery.error}
				<p class="px-3 py-2 text-sm text-destructive" role="status">
					No se pudieron cargar los productos.
				</p>
			{:else if rewardProductsQuery.data?.length}
				{#each rewardProductsQuery.data as row (row.variantId)}
					<button
						type="button"
						role="option"
						aria-selected="false"
						disabled={pendingId !== null}
						class="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground disabled:pointer-events-none disabled:opacity-60"
						onclick={() => addReward(row.variantId)}
					>
						<span
							class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-muted"
						>
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
						{#if pendingId === row.variantId}
							<Spinner class="size-4" />
						{/if}
					</button>
				{/each}
			{:else}
				<p class="px-3 py-2 text-sm text-muted-foreground" role="status">Sin resultados</p>
			{/if}
		{/snippet}
	</SearchInput>

	<p id={hintId} class="text-xs text-muted-foreground">
		Escribe al menos dos letras. Solo aparecen productos activos y disponibles que aún no son
		recompensa.
	</p>
</div>
