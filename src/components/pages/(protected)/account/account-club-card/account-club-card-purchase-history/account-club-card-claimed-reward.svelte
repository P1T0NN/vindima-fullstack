<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';

	// STATE
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
import { hasErrorMessage } from '@/shared/utils/errorMessage';
	import { resolvedDisplayName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	// TYPES
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	let {
		el = $bindable(null),
		onCancelled
	}: {
		/** Root element, exposed so the parent can move focus here after a claim. */
		el?: HTMLDivElement | null;
		/** Fired after a successful cancel — the parent announces it and refocuses the picker. */
		onCancelled: (message: string) => void;
	} = $props();

	const cancelRewardClaim = useMutation(
		api.tables.rewardClaims.mutations.cancelRewardClaim.cancelRewardClaim
	);

	const rewards = $derived(authClass.currentUser?.rewards ?? null);
	const activeClaim = $derived(rewards?.activeClaim ?? null);
	const claimName = $derived.by(() => {
		if (!activeClaim) return '';
		const resolved = (rewards?.rewardProducts ?? []).find(
			(p: ResolvedCartProduct) => p.productRef === activeClaim.itemRef
		);
		return resolved
			? resolvedDisplayName({ ...resolved, ref: activeClaim.itemRef })
			: activeClaim.itemRef;
	});

	let isBusy = $state(false);

	async function changeChoice() {
		if (!activeClaim || isBusy) return;
		isBusy = true;
		try {
			// Cancel returns the reward to the balance; the query then re-renders the picker.
			let result;
			try {
				result = await cancelRewardClaim({ claimId: activeClaim.claimId });
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

			onCancelled('La recompensa volvió a tu saldo. Puedes elegir otra.');
		} finally {
			isBusy = false;
		}
	}
</script>

<div
	bind:this={el}
	tabindex="-1"
	class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-accent/10 bg-chart-2/12 px-5 py-4"
>
	<p class="text-sm leading-snug text-accent">
		Artículo gratis reservado:
		<strong class="font-semibold">{claimName}</strong>
		<span class="text-muted-foreground">- Lo agregaremos a tu próximo pedido.</span>
	</p>
	<ActionButton
		function={changeChoice}
		variant="destructive"
		isPending={isBusy}
		isDestructive
		title="¿Cambiar tu recompensa?"
		description="Se cancela la reserva y la recompensa vuelve a tu saldo para que elijas otra."
		class="h-auto min-h-11 px-5 py-3 text-sm tracking-wider uppercase"
	>
		Cancelar y cambiar elección
	</ActionButton>
</div>
