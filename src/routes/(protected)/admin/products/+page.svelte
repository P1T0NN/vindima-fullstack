<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import AdminProductsTable from '@/components/pages/(protected)/admin/products/admin-products-table.svelte';
</script>

<SvelteHead
	title="Productos"
	noindex
	description="Administra tu catálogo de Vindima: productos, variantes, precios y disponibilidad."
/>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminProductsTable />
</section>
