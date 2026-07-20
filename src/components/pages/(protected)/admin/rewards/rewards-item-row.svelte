<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// CONFIG
	import { CART_CONFIG } from '@/shared/config';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { RewardItemRow } from '@/shared/features/productVariants/types/productVariantsTypes';

	// LUCIDE ICONS
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	// Rendered inside ConvexDataList's <li> (see /admin/rewards).
	let { item }: { item: RewardItemRow } = $props();

	const convex = useConvexClient();
	let busy = $state(false);

	const displayName = $derived(
		item.product
			? item.label
				? `${item.product.name} · ${item.label}`
				: item.product.name
			: item.ref
	);
	// Customers only see redeemable items — flag anything the snapshot is hiding right now.
	const notPurchasable = $derived(item.product?.status !== 'active' || !item.available);

	async function remove() {
		if (busy) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.productVariants.mutations.setVariantRewardEligible.setVariantRewardEligible,
				{ variantId: item._id, eligible: false }
			);
			toastResult(res);
		} finally {
			busy = false;
		}
	}
</script>

<div class="flex items-center justify-between gap-3 py-3">
	<div class="flex min-w-0 items-center gap-3">
		<span class="size-9 shrink-0 overflow-hidden rounded-md bg-muted">
			{#if item.product?.images[0]}
				<img src={item.product.images[0]} alt="" class="size-full object-cover" />
			{/if}
		</span>
		<div class="min-w-0">
			<p class="truncate font-medium">{displayName}</p>
			<p class="text-xs text-muted-foreground">
				{formatMoneyMinor(item.priceMinor, CART_CONFIG.CURRENCY)}
				{#if notPurchasable}
					<span class="text-destructive">
						· No disponible para compra — oculto para los clientes</span
					>
				{/if}
			</p>
		</div>
	</div>

	<ActionButton
		function={remove}
		variant="ghost"
		size="sm"
		class="shrink-0 text-destructive hover:text-destructive"
		isDestructive
		isPending={busy}
		title={`¿Quitar ${displayName} de las recompensas?`}
		description={`Los clientes ya no pueden elegir ${displayName} como artículo gratis. Si alguien ya lo tiene reservado, la reserva sigue siendo válida — la eliminación solo impide nuevos canjes.`}
	>
		<Trash2Icon class="size-4" />
		Eliminar
	</ActionButton>
</div>
