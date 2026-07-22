<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminOrderDetail from '@/components/pages/(protected)/admin/orders/admin-order-detail.svelte';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	// `params.id` is `string | undefined` at the type level; `'skip'` the query while missing.
	const orderId = $derived(page.params.id);

	const orderQuery = useQuery(
		api.tables.orders.queries.fetchOrderForAdmin.fetchOrderForAdmin,
		() => (orderId ? { orderId } : 'skip')
	);
	const order = $derived(orderQuery.data as Doc<'orders'> | null | undefined);
</script>

<SvelteHead title="Pedido" noindex description="Detalle de un pedido de Vindima." />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	{#if orderQuery.error}
		<ErrorComponent
			variant="alert"
			title="No se pudo cargar el pedido"
			description="No pudimos cargar este pedido. Inténtalo de nuevo."
		/>
	{:else if orderQuery.isLoading}
		<p class="py-12 text-center text-sm text-muted-foreground">Cargando pedido…</p>
	{:else if !order}
		<ErrorComponent
			variant="alert"
			title="Pedido no encontrado"
			description="Este pedido no existe o fue eliminado."
		/>
	{:else}
		{#key order._id}
			<AdminOrderDetail {order} />
		{/key}
	{/if}
</section>
