<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import * as Select from '@/components/ui/select/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';
	import type { Id } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';

	/** Products with at least one addable variant (active product, available, not yet a reward). */
	let { candidates }: { candidates: AdminProductRow[] } = $props();

	const convex = useConvexClient();

	let productId = $state('');
	let variantId = $state('');
	let busy = $state(false);

	const selectedProduct = $derived(candidates.find((p) => p._id === productId));
	const addableVariants = $derived(
		(selectedProduct?.variants ?? []).filter((v) => v.available && v.rewardEligible !== true)
	);
	// Single-variant products need no second pick — auto-select it.
	const resolvedVariantId = $derived(
		addableVariants.length === 1 ? addableVariants[0]._id : variantId
	);

	const productLabel = $derived(selectedProduct?.name ?? 'Choose a product');
	const variantLabel = $derived(
		addableVariants.find((v) => v._id === resolvedVariantId)?.label ?? 'Choose a variant'
	);

	async function add() {
		if (busy || !resolvedVariantId) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.products.mutations.setVariantRewardEligible.setVariantRewardEligible,
				{ variantId: resolvedVariantId as Id<'productVariants'>, eligible: true }
			);
			if (toastResult(res)) {
				productId = '';
				variantId = '';
			}
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex flex-wrap items-end gap-3">
	<div class="flex w-full max-w-xs flex-col gap-1.5">
		<span class="text-sm font-medium">Product</span>
		<Select.Root
			type="single"
			bind:value={() => productId, (v) => ((productId = v), (variantId = ''))}
			disabled={busy || candidates.length === 0}
		>
			<Select.Trigger class="w-full">{productLabel}</Select.Trigger>
			<Select.Content>
				{#each candidates as product (product._id)}
					<Select.Item value={product._id}>{product.name}</Select.Item>
				{/each}
			</Select.Content>
		</Select.Root>
	</div>

	{#if selectedProduct && addableVariants.length > 1}
		<div class="flex w-full max-w-45 flex-col gap-1.5">
			<span class="text-sm font-medium">Variant</span>
			<Select.Root type="single" bind:value={variantId} disabled={busy}>
				<Select.Trigger class="w-full">{variantLabel}</Select.Trigger>
				<Select.Content>
					{#each addableVariants as variant (variant._id)}
						<Select.Item value={variant._id}>{variant.label ?? variant.ref}</Select.Item>
					{/each}
				</Select.Content>
			</Select.Root>
		</div>
	{/if}

	<Button type="button" onclick={add} disabled={busy || !resolvedVariantId}>
		<PlusIcon class="size-4" />
		Add reward item
	</Button>
</div>
