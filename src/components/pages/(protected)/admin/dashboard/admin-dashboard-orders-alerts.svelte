<script lang="ts">
	// Zone 1 — order alerts, the work queue (AdminDashboardPageSystemDesign.md §3). Cards
	// link into the orders table pre-filtered; zero-state collapses to one quiet all-clear line.

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import AdminDashboardOrdersAlertsEmpty from './empty/admin-dashboard-orders-alerts-empty.svelte';

	// LUCIDE ICONS
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';
	import PackageIcon from '@lucide/svelte/icons/package';
	import ArrowRightIcon from '@lucide/svelte/icons/arrow-right';

	let { pendingCount, toFulfillCount }: { pendingCount: number; toFulfillCount: number } =
		$props();

	const alerts = $derived(
		[
			{
				count: pendingCount,
				label: pendingCount === 1 ? 'pedido por confirmar' : 'pedidos por confirmar',
				detail: 'pendientes de pago',
				href: `${ADMIN_PAGE_ENDPOINTS.ORDERS}?status=pending`,
				icon: TriangleAlertIcon
			},
			{
				count: toFulfillCount,
				label: toFulfillCount === 1 ? 'pedido por entregar' : 'pedidos por entregar',
				detail: 'pagados, sin entregar',
				href: `${ADMIN_PAGE_ENDPOINTS.ORDERS}?status=paid`,
				icon: PackageIcon
			}
		].filter((alert) => alert.count > 0)
	);
</script>

{#if alerts.length === 0}
	<AdminDashboardOrdersAlertsEmpty />
{:else}
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		{#each alerts as alert (alert.href)}
			<a
				href={alert.href}
				class="group flex items-center gap-3 rounded-xl border border-primary/60 bg-primary/10 px-4 py-3.5 no-underline transition-colors hover:bg-primary/20"
			>
				<alert.icon class="size-5 shrink-0 text-accent" aria-hidden="true" />
				<span class="flex-1 text-sm text-accent">
					<strong class="font-semibold tabular-nums">{alert.count}</strong>
					{alert.label}
					<span class="text-muted-foreground">· {alert.detail}</span>
				</span>
				<ArrowRightIcon
					class="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
					aria-hidden="true"
				/>
			</a>
		{/each}
	</div>
{/if}
