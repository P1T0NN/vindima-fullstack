<script lang="ts">
	// LIBRARIES
	import { SvelteMap } from 'svelte/reactivity';
	import { api } from '@/convex/_generated/api';
	import { useQuery, useConvexClient } from 'convex-svelte';

	// STATE
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { appHref } from '@/utils/app-navigation.js';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	// TYPES
	import type { ResolvedCartProduct } from '@/shared/features/cart/cartItems';
	import type { PurchaseHistoryRow } from '../accountClubCardTypes';

	let { history }: { history: PurchaseHistoryRow[] } = $props();

	const convex = useConvexClient();

	const rewards = $derived(authClass.currentUser?.rewards ?? null);
	const featureOn = $derived(!!rewards);
	const stampsPerReward = $derived(rewards?.stampsPerReward ?? 5);
	const availableRewards = $derived(rewards?.availableRewards ?? 0);
	const activeClaim = $derived(rewards?.activeClaim ?? null);
	const eligibleItems = $derived(rewards?.eligibleItems ?? []);

	// Resolve reward refs (eligible picker + the reserved claim) against the live catalog.
	const rewardRefs = $derived([...eligibleItems, ...(activeClaim ? [activeClaim.itemRef] : [])]);
	const productsQuery = useQuery(
		api.tables.cart.queries.resolveCartProducts.resolveCartProducts,
		() => (rewardRefs.length > 0 ? { refs: rewardRefs } : 'skip')
	);
	const byRef = $derived.by(() => {
		const map = new SvelteMap<string, ResolvedCartProduct>();
		for (const row of productsQuery.data ?? []) map.set(row.productRef, row);
		return map;
	});
	// Eligible items that still resolve as purchasable — archived/unavailable ones drop out (§10).
	const pickerItems = $derived(
		eligibleItems
			.map((ref: string) => byRef.get(ref))
			.filter(
				(p: ResolvedCartProduct | undefined): p is ResolvedCartProduct =>
					!!p && p.unitPriceMinor !== null
			)
	);
	const claimName = $derived(
		activeClaim ? (byRef.get(activeClaim.itemRef)?.name ?? activeClaim.itemRef) : ''
	);

	let selectedItem = $state<string | null>(null);
	let isBusy = $state(false);

	async function claim() {
		if (!selectedItem || isBusy) return;
		isBusy = true;
		try {
			const result = await safeMutation(
				convex,
				api.tables.rewardClaims.mutations.claimReward.claimReward,
				{ itemRef: selectedItem }
			);
			if (toastResult(result)) selectedItem = null;
		} finally {
			isBusy = false;
		}
	}

	async function changeChoice() {
		if (!activeClaim || isBusy) return;
		isBusy = true;
		try {
			// Cancel returns the reward to the balance; the query then re-renders the picker.
			const result = await safeMutation(
				convex,
				api.tables.rewardClaims.mutations.cancelRewardClaim.cancelRewardClaim,
				{ claimId: activeClaim.claimId }
			);
			toastResult(result);
		} finally {
			isBusy = false;
		}
	}
</script>

<div class="px-8 py-8 sm:px-10">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<p class="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
			Historial de compras
		</p>
		<a
			href={appHref(PROTECTED_PAGE_ENDPOINTS.MY_ORDERS)}
			class="inline-flex items-center gap-1.5 text-xs font-medium tracking-wide text-chart-2 uppercase no-underline transition-colors hover:text-accent"
		>
			Mis pedidos
			<ArrowRightIcon class="size-3.5" />
		</a>
	</div>

	<div class="grid grid-cols-3 gap-x-0 text-sm">
		<div class="pb-3 text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
			Fecha
		</div>
		<div class="pb-3 text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase">
			Pedido
		</div>
		<div
			class="pb-3 text-right text-xs font-semibold tracking-wide text-muted-foreground/70 uppercase"
		>
			Total
		</div>

		{#each history as order (order.id)}
			<div class="border-t border-accent/10 py-3 text-muted-foreground">{order.date}</div>
			<div class="border-t border-accent/10 py-3 text-foreground">{order.description}</div>
			<div
				class="border-t border-accent/10 py-3 text-right font-display text-lg font-semibold text-chart-2"
			>
				{formatMoneyMinor(order.totalMinor, order.currency)}
			</div>
		{/each}
	</div>

	<!-- Reward callout: reserved claim → reward ready (picker) → next-reward hint -->
	{#if activeClaim}
		<div
			class="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-chart-2/40 bg-chart-2/12 px-5 py-4"
		>
			<p class="text-sm leading-snug text-accent">
				Artículo gratis reservado:
				<strong class="font-semibold">{claimName}</strong>
				<span class="text-muted-foreground"> · Lo agregaremos a tu próximo pedido.</span>
			</p>
			<Button
				variant="destructive"
				onclick={changeChoice}
				disabled={isBusy}
				class="h-auto px-5 py-3 text-sm tracking-wider uppercase"
			>
				Cancelar y cambiar elección
			</Button>
		</div>
	{:else if availableRewards > 0}
		<div class="mt-6 rounded-lg border border-primary/40 bg-primary/12 px-5 py-5">
			<p class="text-sm font-semibold text-accent">
				{availableRewards > 1
					? `${availableRewards} artículos gratis en espera`
					: '¡Ganaste un artículo gratis!'}
			</p>
			<p class="mt-1 mb-4 text-sm text-muted-foreground">Elige tu recompensa:</p>

			<div class="grid grid-cols-2 gap-3 sm:grid-cols-3">
				{#each pickerItems as item (item.productRef)}
					<button
						type="button"
						onclick={() => (selectedItem = item.productRef)}
						aria-pressed={selectedItem === item.productRef}
						class={selectedItem === item.productRef
							? 'flex flex-col items-center gap-2 rounded-lg border-2 border-accent bg-accent/10 px-3 py-4 text-center transition'
							: 'flex flex-col items-center gap-2 rounded-lg border border-primary/25 bg-background px-3 py-4 text-center transition hover:border-accent/60'}
					>
						{#if item.imageUrl}
							<img src={item.imageUrl} alt="" class="h-14 w-14 object-contain" />
						{/if}
						<span class="text-sm font-medium text-foreground">{item.name}</span>
					</button>
				{/each}
			</div>

			<Button
				onclick={claim}
				disabled={!selectedItem || isBusy}
				class="mt-4 h-auto px-5 py-3 text-sm tracking-wider uppercase"
			>
				Reclamar esta recompensa
			</Button>
		</div>
	{:else if featureOn}
		<div
			class="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-lg border border-primary/40 bg-primary/12 px-5 py-4"
		>
			<p class="text-sm leading-snug text-accent">
				Próxima recompensa:
				<strong class="font-semibold">un artículo gratis de tu elección</strong
				>{` cuando llegues a ${stampsPerReward} compras.`}
			</p>
			<Button href="/#shop" class="h-auto px-5 py-3 text-sm tracking-wider uppercase">
				Sigue comprando
			</Button>
		</div>
	{/if}
</div>
