<script lang="ts">
	// Add a reward item: search an addable product variant, pick it → it's set reward-eligible.
	// One-shot search via SearchInputConvex over `fetchRewardProducts` (no drain-the-catalog
	// subscription). The current-items list lives on `AdminRewardsTable` (live), so it reflects
	// the add automatically.

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from '@mmailaender/convex-svelte';

	// CONFIG
	import { CART_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { SearchInputConvex } from '@/components/ui/search-input/index.js';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { formatVariantName } from '@/shared/features/productVariants/utils/variantDisplayName.js';
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';

	const convex = useConvexClient();
	const uid = $props.id();
	const hintId = `${uid}-hint`;

	let search = $state('');
	/** Variant currently being added — the dropdown row spins on it until the write lands. */
	let pendingId = $state<string | null>(null);

	const money = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);

	// One row per addable variant; its `_id` is what the mutation takes. Price goes in the
	// description so it survives on mobile, and the badge carries the verb, which turns an
	// ambiguous row into an obvious "picking this adds it".
	const toItem = (row: {
		variantId: string;
		productName: string;
		variantLabel: string | null;
		priceMinor: number;
		imageUrl: string | null;
	}) => ({
		id: row.variantId,
		title: formatVariantName(row.productName, row.variantLabel),
		description: money(row.priceMinor),
		category: 'Añadir',
		imageUrl: row.imageUrl ?? undefined
	});

	async function addReward(variantId: string) {
		if (pendingId) return;
		pendingId = variantId;
		try {
			const res = await safeMutation(
				convex,
				api.tables.productVariants.mutations.setVariantRewardEligible.setVariantRewardEligible,
				{ variantId: variantId as Id<'productVariants'>, eligible: true }
			);
			// Clearing the term closes the dropdown (the item is now in the list below). A refusal
			// keeps it open so the owner can read the toast against the row they picked.
			if (toastResult(res)) search = '';
		} finally {
			pendingId = null;
		}
	}
</script>

<div class="flex flex-col gap-2.5 rounded-xl border bg-card p-4">
	<h2 class="flex items-center gap-1.5 text-sm font-semibold">
		<PlusIcon class="size-4 text-muted-foreground" aria-hidden="true" />
		Añadir artículo de recompensa
	</h2>

	<SearchInputConvex
		bind:value={search}
		query={api.tables.productVariants.queries.fetchRewardProducts.fetchRewardProducts}
		mapItem={toItem}
		minQueryLength={2}
		selectValueOnSelect={false}
		keepOpenOnSelect
		{pendingId}
		placeholder="Busca un producto para añadir..."
		aria-label="Buscar un producto para añadir a las recompensas"
		aria-describedby={hintId}
		emptyTitle="Sin resultados"
		emptyDescription="Solo aparecen productos activos y disponibles que aún no son recompensa."
		class="max-w-lg"
		onSelect={(item) => addReward(item.id)}
	/>

	<p id={hintId} class="text-xs text-muted-foreground">
		Escribe al menos dos letras. Solo aparecen productos activos y disponibles que aún no son
		recompensa.
	</p>
</div>
