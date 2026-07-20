<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { CART_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let { variant, product }: { variant: Doc<'productVariants'>; product: Doc<'products'> } =
		$props();

	const convex = useConvexClient();
	let busy = $state(false);

	const displayName = $derived(
		variant.label ? `${product.name} · ${variant.label}` : product.name
	);
	// Customers only see redeemable items — flag anything the snapshot is hiding right now.
	const notPurchasable = $derived(product.status !== 'active' || !variant.available);

	async function remove() {
		if (busy) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.products.mutations.setVariantRewardEligible.setVariantRewardEligible,
				{ variantId: variant._id, eligible: false }
			);
			toastResult(res);
		} finally {
			busy = false;
		}
	}
</script>

<li class="flex items-center justify-between gap-3 py-3">
	<div class="flex min-w-0 items-center gap-3">
		<span class="size-9 shrink-0 overflow-hidden rounded-md bg-muted">
			{#if product.images[0]}
				<img src={product.images[0]} alt="" class="size-full object-cover" />
			{/if}
		</span>
		<div class="min-w-0">
			<p class="truncate font-medium">{displayName}</p>
			<p class="text-xs text-muted-foreground">
				{formatMoneyMinor(variant.priceMinor, CART_CONFIG.CURRENCY)}
				{#if notPurchasable}
					<span class="text-destructive"> · Not currently purchasable — hidden from customers</span>
				{/if}
			</p>
		</div>
	</div>

	<Button
		type="button"
		variant="ghost"
		size="sm"
		class="shrink-0 text-destructive hover:text-destructive"
		onclick={remove}
		disabled={busy}
		aria-label={`Remove ${displayName} from reward items`}
	>
		<Trash2Icon class="size-4" />
		Remove
	</Button>
</li>
