<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminOrdersTable from '@/components/pages/(protected)/admin/orders/admin-orders-table.svelte';
</script>

<SvelteHead
	title="Pedidos"
	noindex
	description="Revisa y administra los pedidos de los clientes de Vindima."
/>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Pedidos</h1>
		<p class="text-sm text-muted-foreground">
			Todos los pedidos, del más reciente al más antiguo. El reembolso liquida un pedido pagado y revierte su sello de recompensa.
		</p>
	</header>

	<AdminOrdersTable />
</section>
