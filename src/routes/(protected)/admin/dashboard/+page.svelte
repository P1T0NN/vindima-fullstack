<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient, useQuery } from 'convex-svelte';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import AdminDashboardHeader from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-header.svelte';
	import AdminDashboardOrdersAlerts from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-orders-alerts.svelte';
	import AdminDashboardKpiRow from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-kpi-row.svelte';
	import AdminDashboardRevenueChart from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-revenue-chart.svelte';
	import AdminDashboardTopList from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-top-list.svelte';
	import AdminDashboardLoading from '@/components/pages/(protected)/admin/dashboard/loading/admin-dashboard-loading.svelte';

	// TEMP — UI preview mock (see admin-dashboard-mock-data.ts). Flip to `false` (or delete the
	// flag, the import, and the mock file) to go back to the real query.
	import { createMockDashboard } from '@/components/pages/(protected)/admin/dashboard/admin-dashboard-mock-data';
	const USE_MOCK = true;

	// TYPES
	import type { DashboardPeriod } from '@/shared/features/orders/types/ordersTypes';

	const convex = useConvexClient();

	let period = $state<DashboardPeriod>('30d');

	// One-shot per period (GeneralSystemDesignRule.md: dashboard trends don't move mid-visit;
	// browser refresh gives fresh data). A new promise per period; `{#await}` below renders
	// pending/loaded/error and always tracks the latest, so no manual race/loading state.
	const dashboard = $derived(
		USE_MOCK
			? Promise.resolve(createMockDashboard(period))
			: convex.query(api.tables.orders.queries.fetchDashboard.fetchDashboard, { period })
	);

	// Zone 1 stays LIVE — the page's single subscription (see fetchOrdersCounts).
	const ordersCountsQuery = useQuery(
		api.tables.orders.queries.fetchOrdersCounts.fetchOrdersCounts,
		{}
	);
</script>

<SvelteHead 
	title="Panel" 
	noindex 
	description="Panel de administración: ventas, pedidos y actividad de la tienda." 
/>

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<AdminDashboardHeader bind:period />

	{#await dashboard}
		<AdminDashboardLoading />
	{:then payload}
		<!-- Order counts prefer the live subscription, falling back to the one-shot payload
		     for the very first paint. (Mock mode uses the payload counts directly.) -->
		{@const ordersCounts = USE_MOCK ? payload.ordersCounts : (ordersCountsQuery.data ?? payload.ordersCounts)}
		<div class="flex flex-col gap-6">
			<!-- Zone 1 · Order alerts (live) -->
			<AdminDashboardOrdersAlerts
				pendingCount={ordersCounts.pendingCount}
				toFulfillCount={ordersCounts.toFulfillCount}
			/>

			<!-- Zone 2 · KPIs -->
			<AdminDashboardKpiRow
				current={payload.kpis.current}
				previous={payload.kpis.previous}
				currency={payload.currency}
			/>

			<!-- Zone 3 · Trend -->
			<AdminDashboardRevenueChart
				series={payload.revenueSeries}
				{period}
				currency={payload.currency}
			/>

			<!-- Zone 4 · Rankings -->
			<div class="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
				<AdminDashboardTopList
					title="Top productos"
					items={payload.topProducts}
					currency={payload.currency}
					emptyText="Sin ventas en este periodo."
				/>
				<AdminDashboardTopList
					title="Ventas por categoría"
					items={payload.categoryRevenue}
					currency={payload.currency}
					emptyText="Sin ventas en este periodo."
				/>
			</div>
		</div>
	{:catch}
		<ErrorComponent
			variant="alert"
			title="No se pudo cargar el panel"
			description="Algo salió mal al obtener los datos. Recarga la página para intentarlo de nuevo."
		/>
	{/await}
</section>
