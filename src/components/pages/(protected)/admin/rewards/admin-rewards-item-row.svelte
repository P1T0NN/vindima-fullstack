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
	import CircleAlertIcon from '@lucide/svelte/icons/circle-alert';

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

<div class="flex items-center gap-3 py-3">
	<span class="size-10 shrink-0 overflow-hidden rounded-md border bg-muted">
		{#if item.product?.images[0]}
			<img src={item.product.images[0]} alt="" class="size-full object-cover" />
		{/if}
	</span>

	<div class="min-w-0 flex-1">
		<p class="truncate text-sm font-medium">{displayName}</p>

		{#if notPurchasable}
			<p class="mt-0.5 flex items-center gap-1 text-xs text-destructive">
				<CircleAlertIcon class="size-3.5 shrink-0" aria-hidden="true" />
				<span class="truncate">No disponible para compra, oculto para los clientes</span>
			</p>
		{/if}
	</div>

	<span class="shrink-0 text-sm font-medium tabular-nums">
		{formatMoneyMinor(item.priceMinor, CART_CONFIG.CURRENCY)}
	</span>

	<ActionButton
		function={remove}
		variant="ghost"
		size="sm"
		class="shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
		isDestructive
		isPending={busy}
		title={`¿Quitar ${displayName} de las recompensas?`}
		description={`Los clientes ya no pueden elegir ${displayName} como artículo gratis. Si alguien ya lo tiene reservado, la reserva sigue siendo válida: quitarlo solo impide nuevos canjes.`}
	>
		<Trash2Icon class="size-4" />
		<span class="hidden sm:inline">Eliminar</span>
	</ActionButton>
</div>
