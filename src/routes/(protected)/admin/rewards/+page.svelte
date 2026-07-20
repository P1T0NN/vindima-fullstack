<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/config';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import AdminRewardsHeader from '@/components/pages/(protected)/admin/rewards/admin-rewards-header.svelte';
	import RewardsAddForm from '@/components/pages/(protected)/admin/rewards/rewards-add-form.svelte';
	import RewardsTable from '@/components/pages/(protected)/admin/rewards/rewards-table.svelte';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';

	// Catalog subscription for the add-picker candidates; the current-items list is
	// `RewardsTable`'s own paginated subscription (both are live, so they can't drift).
	const catalogQuery = useQuery(
		api.tables.products.queries.fetchRewardCatalog.fetchRewardCatalog,
		() => ({ paginationOpts: { numItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE, cursor: null } })
	);
	const catalog = $derived(catalogQuery.data?.page as AdminProductRow[] | undefined);

	// Picker candidates: active products with ≥1 available, not-yet-reward variant.
	const candidates = $derived(
		(catalog ?? []).filter(
			(product) =>
				product.status === 'active' &&
				product.variants.some((variant) => variant.available && variant.rewardEligible !== true)
		)
	);
</script>

<SvelteHead
	title="Recompensas"
	noindex
	description="Configura qué artículos pueden canjear los clientes con sus sellos de recompensa de Vindima."
/>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminRewardsHeader />

	{#if catalogQuery.error}
		<ErrorComponent
			variant="alert"
			title="No se pudieron cargar los artículos de recompensa"
			description="Algo salió mal al obtener el catálogo. Inténtalo de nuevo."
		/>
	{:else}
		{#if catalog === undefined}
			<Skeleton class="h-16 w-full max-w-lg" />
		{:else}
			<RewardsAddForm {candidates} />
		{/if}

		<RewardsTable />
	{/if}
</section>
