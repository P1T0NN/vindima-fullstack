<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';

	// CONFIG
	import { CART_CONFIG } from '@/shared/features/cart/config';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
import { hasErrorMessage } from '@/shared/utils/errorMessage';
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { RewardItemRow } from '@/shared/features/productVariants/types/productVariantsTypes';

	// Rendered as the content of a DataList item (see /admin/rewards) — this
	// component owns its own root element, which is what the list's `divide-y` divides.
	let { item }: { item: RewardItemRow } = $props();

	const setVariantRewardEligible = useMutation(
		api.tables.productVariants.mutations.setVariantRewardEligible.setVariantRewardEligible
	);
	let busy = $state(false);

	const displayName = $derived(
		item.product
			? item.label
				? `${item.product.name} - ${item.label}`
				: item.product.name
			: item.ref
	);
	// Customers only see redeemable items — flag anything the snapshot is hiding right now.
	const notPurchasable = $derived(item.product?.status !== 'active' || !item.available);

	async function remove() {
		if (busy) return;
		busy = true;
		try {
			let result;
			try {
				result = await setVariantRewardEligible({ variantId: item._id, eligible: false });
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
				<span class="icon-[lucide--circle-alert] size-3.5 shrink-0" aria-hidden="true"></span>
				<span class="truncate">No disponible para compra, oculto para los clientes</span>
			</p>
		{/if}
	</div>

	<span class="shrink-0 text-sm font-medium tabular-nums">
		{formatMoneyMinor(item.priceMinor, CART_CONFIG.CURRENCY)}
	</span>

	<ActionButton
		function={remove}
		variant="destructive"
		size="sm"
		class="shrink-0"
		isDestructive
		isPending={busy}
		title={`¿Quitar ${displayName} de las recompensas?`}
		description={`Los clientes ya no pueden elegir ${displayName} como artículo gratis. Si alguien ya lo tiene reservado, la reserva sigue siendo válida: quitarlo solo impide nuevos canjes.`}
	>
		<span class="icon-[lucide--trash-2] size-4"></span>
		<span class="hidden sm:inline">Eliminar</span>
	</ActionButton>
</div>
