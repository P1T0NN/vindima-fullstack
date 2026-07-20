<script lang="ts">
	// LIBRARIES
	import { useQuery } from '@mmailaender/convex-svelte';
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import AccountClubCard from '@/components/pages/(protected)/account/account-club-card/account-club-card.svelte';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';

	// UTILS
	import { formatOrderDate } from '@/features/orders/utils/ordersUtils.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { PurchaseHistoryRow } from '@/components/pages/(protected)/account/account-club-card/accountClubCardTypes';

	// The few newest orders for the club card's history strip — the limit lives in the query
	// (server-side `take`), so there's no client-side trimming.
	const latestOrdersQuery = useQuery(
		api.tables.orders.queries.fetchMyLatestOrders.fetchMyLatestOrders,
		() => ({})
	);
	const history = $derived<PurchaseHistoryRow[]>(
		((latestOrdersQuery.data ?? []) as Doc<'orders'>[]).map((order) => ({
			id: order._id,
			date: formatOrderDate(order._creationTime),
			description: order.lines.map((line) => line.name).join(' · '),
			totalMinor: order.amounts.totalMinor,
			currency: order.currency
		}))
	);
</script>

<SvelteHead
	title="Mi cuenta"
	noindex
	description="Administra tu membresía del club Vindima, tus recompensas y tu historial de compras."
/>

<Section
	yPadding="none"
	class="min-h-[calc(100dvh-3.5rem)] bg-secondary py-16 pb-24 sm:pb-28"
>
	<AccountClubCard {history} />

	<div class="mt-8 flex justify-center">
		<LogoutButton />
	</div>
</Section>
