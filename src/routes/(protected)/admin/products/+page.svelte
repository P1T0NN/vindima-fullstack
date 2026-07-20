<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminProductsHeader from '@/components/pages/(protected)/admin/products/admin-products-header.svelte';
	import AdminProductsTable from '@/components/pages/(protected)/admin/products/admin-products-table.svelte';
</script>

<SvelteHead />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminProductsHeader />
	<AdminProductsTable />
</section>
