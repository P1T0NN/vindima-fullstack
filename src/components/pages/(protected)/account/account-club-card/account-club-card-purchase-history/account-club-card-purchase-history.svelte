<script lang="ts">
	// SVELTE
	import { onMount } from 'svelte';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from '@mmailaender/convex-svelte';

	// STATE
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import DataList from '@/components/ui/data-list/data-list.svelte';
	import AccountClubCardOrderItem from './account-club-card-order-item.svelte';
	import AccountClubCardClaimedReward from './account-club-card-claimed-reward.svelte';
	import AccountClubCardChooseReward from './account-club-card-choose-reward.svelte';
	import AccountClubCardNextReward from './account-club-card-next-reward.svelte';
	import AccountClubCardPurchaseHistoryLoading from '../../loading/account-club-card-purchase-history-loading.svelte';
	import AccountClubCardPurchaseHistoryEmpty from '../../empty/account-club-card-purchase-history-empty.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	import { formatOrderDate } from '@/features/orders/utils/ordersUtils.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { PurchaseHistoryRow } from '../accountClubCardTypes';

	// LUCIDE ICONS
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	const convex = useConvexClient();

	// The few newest orders for the history strip — the limit lives in the query (server-side
	// `take`), so there's no client-side trimming. ONE-SHOT, not `useQuery`: the viewer's own
	// latest orders don't change under them while they read their account page
	// (GeneralSystemDesignRule § realtime is opt-in). `null` = still loading.
	let latestOrders = $state<Doc<'orders'>[] | null>(null);
	onMount(async () => {
		latestOrders = (await convex.query(
			api.tables.orders.queries.fetchMyLatestOrders.fetchMyLatestOrders,
			{}
		)) as Doc<'orders'>[];
	});
	const historyLoading = $derived(latestOrders === null);
	const history = $derived<PurchaseHistoryRow[]>(
		(latestOrders ?? []).map((order) => ({
			id: order._id,
			date: formatOrderDate(order._creationTime),
			description: order.lines.map((line) => line.name).join(' · '),
			totalMinor: order.amounts.totalMinor,
			currency: order.currency
		}))
	);

	const rewards = $derived(authClass.currentUser?.rewards ?? null);
	const featureOn = $derived(!!rewards);
	const availableRewards = $derived(rewards?.availableRewards ?? 0);
	const activeClaim = $derived(rewards?.activeClaim ?? null);

	// Focus choreography lives HERE because it crosses siblings: a claim/cancel unmounts the
	// button the user pressed, and its replacement callout only renders once the auth store
	// pushes the new reward state — so the child reports success, and an effect focuses the
	// sibling once it mounts.
	let liveMessage = $state('');
	let pendingFocusClaim = $state(false);
	let pendingFocusPicker = $state(false);
	let claimCallout = $state<HTMLDivElement | null>(null);
	let pickerCallout = $state<HTMLDivElement | null>(null);

	$effect(() => {
		if (pendingFocusClaim && claimCallout) {
			claimCallout.focus();
			pendingFocusClaim = false;
		}
	});

	$effect(() => {
		if (pendingFocusPicker && pickerCallout) {
			pickerCallout.focus();
			pendingFocusPicker = false;
		}
	});
</script>

<div class="px-5 py-8 sm:px-10">
	<div class="mb-4 flex flex-wrap items-center justify-between gap-3">
		<p
			id="purchase-history-label"
			class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
		>
			Historial de compras
		</p>

		<Button
			href={appHref(PROTECTED_PAGE_ENDPOINTS.MY_ORDERS)}
			variant="link"
			class="inline-flex min-h-11 items-center gap-1.5 text-xs font-medium tracking-wide uppercase"
		>
			Mis pedidos
			<ArrowRightIcon class="size-3.5" />
		</Button>
	</div>

	<DataList
		items={history}
		isLoading={historyLoading}
		role="table"
		ariaLabelledby="purchase-history-label"
		class="text-sm"
		getItemKey={(order) => order.id}
		{item}
		{empty}
		{loading}
		{header}
	/>

	<p class="sr-only" role="status">{liveMessage}</p>

	<!-- Reward callout: reserved claim → reward ready (picker) → next-reward hint -->
	{#if activeClaim}
		<AccountClubCardClaimedReward
			bind:el={claimCallout}
			onCancelled={(message) => {
				liveMessage = message;
				pendingFocusPicker = true;
			}}
		/>
	{:else if availableRewards > 0}
		<AccountClubCardChooseReward
			bind:el={pickerCallout}
			onClaimed={(message) => {
				liveMessage = message;
				pendingFocusClaim = true;
			}}
		/>
	{:else if featureOn}
		<AccountClubCardNextReward />
	{/if}
</div>

{#snippet header()}
	<div role="row" class="grid grid-cols-3">
		<span
			role="columnheader"
			class="pb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase max-sm:sr-only"
		>
			Fecha
		</span>
		<span
			role="columnheader"
			class="pb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase max-sm:sr-only"
		>
			Pedido
		</span>
		<span
			role="columnheader"
			class="pb-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase max-sm:sr-only"
		>
			Total
		</span>
	</div>
{/snippet}

{#snippet item({ item: order }: { item: PurchaseHistoryRow })}
	<AccountClubCardOrderItem {order} />
{/snippet}

{#snippet empty()}
	<AccountClubCardPurchaseHistoryEmpty />
{/snippet}

{#snippet loading()}
	<AccountClubCardPurchaseHistoryLoading />
{/snippet}
