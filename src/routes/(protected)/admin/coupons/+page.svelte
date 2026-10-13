<script lang="ts">
	// CONVEX
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { PAGINATION_CONFIG } from '@/shared/features/pagination/config.js';

	// COMPONENTS
	import AdminCouponsHeader from '@/components/pages/(protected)/admin/coupons/admin-coupons-header.svelte';
	import AdminCouponsTableItem from '@/components/pages/(protected)/admin/coupons/admin-coupons-table-item/admin-coupons-table-item.svelte';
	import AdminCouponsTableLoading from '@/components/pages/(protected)/admin/coupons/loading/admin-coupons-table-loading.svelte';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import { TableHead } from '@/components/ui/table/index.js';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	const coupons = useConvexPagination(
		api.tables.coupons.queries.fetchCouponsAdmin.fetchCouponsAdmin,
		() => ({}),
		{ pageSize: PAGINATION_CONFIG.DEFAULT_PAGE_SIZE }
	);
</script>

<SvelteHead title="Cupones" noindex />

<div class="flex min-h-full min-w-0 flex-1 flex-col gap-6 p-4 md:p-6">
	<DataTable pagination={coupons} key={(coupon) => coupon._id} placement="above">
		{#snippet header()}
			<AdminCouponsHeader />
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-48">Nombre</TableHead>
			<TableHead>Código</TableHead>
			<TableHead>Descuento</TableHead>
			<TableHead>Estado</TableHead>
			<TableHead>Vence</TableHead>
			<TableHead>Usos</TableHead>
			<TableHead></TableHead>
		{/snippet}

		{#snippet row(coupon)}
			<AdminCouponsTableItem {coupon} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminCouponsTableLoading />
		{/snippet}

		{#snippet errorSnippet()}
			<ErrorComponent
				title="No pudimos cargar los cupones"
				description="Inténtalo de nuevo."
				onRetry={() => window.location.reload()}
			/>
		{/snippet}

		{#snippet empty()}
			<EmptyData
				title="Aún no hay cupones"
				description="Crea un código de descuento para usar al pagar."
			/>
		{/snippet}
	</DataTable>
</div>
