<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';

	// STATE
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
import { hasErrorMessage } from '@/shared/utils/errorMessage';
	import { resolvedDisplayName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	// TYPES
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';

	let {
		el = $bindable(null),
		onClaimed
	}: {
		/** Root element, exposed so the parent can move focus here after a cancel. */
		el?: HTMLDivElement | null;
		/** Fired after a successful claim — the parent announces it and refocuses the claim callout. */
		onClaimed: (message: string) => void;
	} = $props();

	const claimReward = useMutation(api.tables.rewardClaims.mutations.claimReward.claimReward);

	const rewards = $derived(authClass.currentUser?.rewards ?? null);
	const availableRewards = $derived(rewards?.availableRewards ?? 0);
	// Eligible items that still resolve as purchasable — archived/unavailable ones drop out (§10).
	const pickerItems = $derived(
		(rewards?.eligibleItems ?? [])
			.map((ref: string) =>
				(rewards?.rewardProducts ?? []).find((p: ResolvedCartProduct) => p.productRef === ref)
			)
			.filter(
				(p: ResolvedCartProduct | undefined): p is ResolvedCartProduct =>
					!!p && p.unitPriceMinor !== null
			)
	);

	let selectedItem = $state<string | null>(null);
	let isBusy = $state(false);

	async function claim() {
		if (!selectedItem || isBusy) return;
		isBusy = true;
		try {
			let result;
			try {
				result = await claimReward({ itemRef: selectedItem });
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

			selectedItem = null;
			onClaimed('Recompensa reservada. La agregaremos a tu próximo pedido.');
		} finally {
			isBusy = false;
		}
	}
</script>

<div bind:this={el} tabindex="-1" class="mt-6 border-t border-accent/10 bg-primary/12 px-5 py-5">
	<p class="text-sm font-semibold text-accent">
		{availableRewards > 1
			? `${availableRewards} artículos gratis en espera`
			: '¡Ganaste un artículo gratis!'}
	</p>
	<p id="reward-picker-label" class="mt-1 mb-4 text-sm text-muted-foreground">
		Elige tu recompensa:
	</p>

	<div
		role="radiogroup"
		aria-labelledby="reward-picker-label"
		class="grid grid-cols-2 gap-3 sm:grid-cols-3"
	>
		{#each pickerItems as item (item.productRef)}
			<button
				type="button"
				role="radio"
				aria-checked={selectedItem === item.productRef}
				onclick={() => (selectedItem = item.productRef)}
				class={selectedItem === item.productRef
					? 'flex flex-col items-center gap-2 rounded-lg border border-accent bg-accent/10 px-3 py-4 text-center ring-2 ring-accent transition-colors focus-visible:ring-2 focus-visible:ring-ring'
					: 'flex flex-col items-center gap-2 rounded-lg border border-primary/25 bg-background px-3 py-4 text-center transition-colors hover:border-accent/60 focus-visible:ring-2 focus-visible:ring-ring'}
			>
				{#if item.imageUrl}
					<img
						src={item.imageUrl}
						alt=""
						width="56"
						height="56"
						loading="lazy"
						decoding="async"
						class="h-14 w-14 object-contain"
					/>
				{/if}
				<span class="text-sm font-medium text-foreground">
					{resolvedDisplayName({ ...item, ref: item.productRef })}
				</span>
			</button>
		{/each}
	</div>

	<Button
		onclick={claim}
		disabled={!selectedItem || isBusy}
		class="mt-4 h-auto min-h-11 px-5 py-3 text-sm tracking-wider uppercase"
	>
		{#if isBusy}<Spinner class="size-3.5" />{/if}
		Reclamar esta recompensa
	</Button>
</div>
