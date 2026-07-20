<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import ConvexDataList from '@/components/ui/data-list/convex-data-list.svelte';
	import MyOrdersHeader from '@/components/pages/(protected)/my-orders/my-orders-header.svelte';
	import MyOrderCard from '@/components/pages/(protected)/my-orders/my-order-card.svelte';
	import MyOrdersEmpty from '@/components/pages/(protected)/my-orders/empty/my-orders-empty.svelte';
	import MyOrdersLoading from '@/components/pages/(protected)/my-orders/loading/my-orders-loading.svelte';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
</script>

<SvelteHead title="My Orders" />

<Section
	yPadding="none"
	class="min-h-[calc(100dvh-3.5rem)] bg-secondary py-16 pb-24 sm:pb-28"
>
	<MyOrdersHeader />

	<ConvexDataList
		query={api.tables.orders.queries.fetchMyOrders.fetchMyOrders}
		getItemKey={(order: Doc<'orders'>) => order._id}
		{item}
		{empty}
		{loading}
	/>
</Section>

{#snippet item({ item: order }: { item: Doc<'orders'> })}
	<MyOrderCard {order} />
{/snippet}

{#snippet empty()}
	<MyOrdersEmpty />
{/snippet}

{#snippet loading()}
	<MyOrdersLoading />
{/snippet}
