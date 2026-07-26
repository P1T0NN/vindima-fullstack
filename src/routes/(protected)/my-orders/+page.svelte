<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import ConvexDataList from '@/components/ui/data-list/convex-data-list.svelte';
	import TabComponent from '@/components/ui/tab-component/tab-component.svelte';
	import MyOrdersHeader from '@/components/pages/(protected)/my-orders/my-orders-header.svelte';
	import MyOrderCard from '@/components/pages/(protected)/my-orders/my-order-card.svelte';
	import MyOrdersEmpty from '@/components/pages/(protected)/my-orders/empty/my-orders-empty.svelte';
	import MyOrdersTabEmpty from '@/components/pages/(protected)/my-orders/empty/my-orders-tab-empty.svelte';
	import MyOrdersLoading from '@/components/pages/(protected)/my-orders/loading/my-orders-loading.svelte';

	// TYPES
	import type { MyOrderRow, MyOrdersTab } from '@/shared/features/orders/types/ordersTypes';
	import type { TabComponentContext, TabComponentTabs } from '@/components/ui/tab-component/types.js';

	// Tab values ARE the `fetchMyOrders` status filters (plus `all`), so schema and UI can't
	// drift; only the Spanish labels live here.
	const ORDER_TABS = [
		{ value: 'all', label: 'Todos' },
		{ value: 'pending', label: 'Por pagar' },
		{ value: 'paid', label: 'Pagados' },
		{ value: 'closed', label: 'Cancelados' }
	] as const satisfies TabComponentTabs<MyOrdersTab>;
</script>

<SvelteHead
	title="Mis pedidos"
	noindex
	description="Consulta tus pedidos anteriores de Vindima y sigue su estado."
/>

<Section yPadding="none" class="min-h-[calc(100dvh-3.5rem)] bg-secondary py-16 pb-24 sm:pb-28">
	<MyOrdersHeader />

	<TabComponent
		tabs={ORDER_TABS}
		listClass="border border-border bg-card"
		contentClass="pt-6"
		{content}
	/>
</Section>

{#snippet content(ctx: TabComponentContext<MyOrdersTab>)}
	{#snippet emptyState()}
		{#if ctx.value === 'all'}
			<MyOrdersEmpty />
		{:else}
			<MyOrdersTabEmpty tab={ctx.value} />
		{/if}
	{/snippet}

	<ConvexDataList
		query={api.tables.orders.queries.fetchMyOrders.fetchMyOrders}
		queryArgs={ctx.value === 'all' ? undefined : { status: ctx.value }}
		getItemKey={(order: MyOrderRow) => order._id}
		{item}
		empty={emptyState}
		{loading}
	/>
{/snippet}

{#snippet item({ item: order }: { item: MyOrderRow })}
	<MyOrderCard {order} />
{/snippet}

{#snippet loading()}
	<MyOrdersLoading />
{/snippet}
