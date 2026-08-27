<script lang="ts">
	// CONVEX
	import { api } from '@/convex/_generated/api';
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';

	// COMPONENTS
	import DataList from '@/components/ui/custom-components/data-list/data-list.svelte';
	import AdminRewardsItemRow from './admin-rewards-item-row.svelte';
	import AdminRewardsTableLoading from './loading/admin-rewards-table-loading.svelte';
	import AdminRewardsTableEmpty from './empty/admin-rewards-table-empty.svelte';

	// TYPES
	import type { RewardItemRow } from '@/shared/features/productVariants/types/productVariantsTypes';

	const rewardItems = useConvexPagination(
		api.tables.productVariants.queries.fetchRewardItems.fetchRewardItems,
		() => ({})
	);
</script>

<div class="flex flex-col gap-2.5">
	<h2 class="text-sm font-semibold">Artículos de recompensa actuales</h2>

	<DataList
		pagination={rewardItems}
		placement="above"
		key={(item: RewardItemRow) => item._id}
		class="gap-0 divide-y divide-border rounded-xl border bg-card px-4"
	>
		{#snippet children(item: RewardItemRow)}
			<AdminRewardsItemRow {item} />
		{/snippet}

		{#snippet loadingSnippet()}
			<AdminRewardsTableLoading />
		{/snippet}

		{#snippet empty()}
			<AdminRewardsTableEmpty />
		{/snippet}

		{#snippet errorSnippet()}
			<p
				class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
			>
				No se pudieron cargar los artículos de recompensa.
			</p>
		{/snippet}
	</DataList>
</div>
