<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminOrdersTable from '@/components/pages/(protected)/admin/orders/admin-orders-table.svelte';
	import AdminOrdersHeader from '@/components/pages/(protected)/admin/orders/admin-orders-header.svelte';
</script>

<SvelteHead
	title="Pedidos"
	noindex
	description="Revisa y administra los pedidos de los clientes de Vindima."
/>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminOrdersHeader />

	<AdminOrdersTable />
</section>
