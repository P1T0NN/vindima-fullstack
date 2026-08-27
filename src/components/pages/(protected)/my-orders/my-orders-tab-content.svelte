<script lang="ts">
	// CONVEX
	import { api } from '@/convex/_generated/api';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import MyOrderCard from './my-order-card.svelte';
	import MyOrdersEmpty from './empty/my-orders-empty.svelte';
	import MyOrdersTabEmpty from './empty/my-orders-tab-empty.svelte';
	import MyOrdersLoading from './loading/my-orders-loading.svelte';

	// TYPES
	import type { MyOrderRow, MyOrdersTab } from '@/shared/features/orders/types/ordersTypes';

	let { tab }: { tab: MyOrdersTab } = $props();

	const orders = useConvexPagination(
		api.tables.orders.queries.fetchMyOrders.fetchMyOrders,
		() => ({ status: tab === 'all' ? undefined : tab }),
		{ pageSize: PAGINATION_DATA.DEFAULT_PAGE_SIZE }
	);
</script>

<DataList pagination={orders} class="gap-4" key={(order) => order._id}>
	{#snippet children(order: MyOrderRow)}
		<MyOrderCard {order} />
	{/snippet}

	{#snippet loadingSnippet()}
		<MyOrdersLoading />
	{/snippet}

	{#snippet empty()}
		{#if tab === 'all'}
			<MyOrdersEmpty />
		{:else}
			<MyOrdersTabEmpty {tab} />
		{/if}
	{/snippet}

	{#snippet errorSnippet()}
		<p
			class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
		>
			No se pudieron cargar tus pedidos.
		</p>
	{/snippet}
</DataList>
