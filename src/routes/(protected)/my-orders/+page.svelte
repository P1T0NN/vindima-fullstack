<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import TabComponent from '@/components/ui/custom-components/tab-component/tab-component.svelte';
	import MyOrdersHeader from '@/components/pages/(protected)/my-orders/my-orders-header.svelte';
	import MyOrdersTabContent from '@/components/pages/(protected)/my-orders/my-orders-tab-content.svelte';

	// TYPES
	import type { MyOrdersTab } from '@/shared/features/orders/types/ordersTypes';
	import type {
		TabComponentContext,
		TabComponentTabs
	} from '@/components/ui/custom-components/tab-component/types.js';

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
	<MyOrdersTabContent tab={ctx.value} />
{/snippet}
