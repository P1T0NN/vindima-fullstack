<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexDataList from '@/components/ui/data-list/convex-data-list.svelte';
	import AdminRewardsItemRow from './admin-rewards-item-row.svelte';
	import AdminRewardsTableLoading from './loading/admin-rewards-table-loading.svelte';
	import AdminRewardsTableEmpty from './empty/admin-rewards-table-empty.svelte';

	// TYPES
	import type { RewardItemRow } from '@/shared/features/productVariants/types/productVariantsTypes';
</script>

<div class="flex flex-col gap-2">
	<h2 class="text-sm font-semibold">Artículos de recompensa actuales</h2>

	<ConvexDataList
		query={api.tables.productVariants.queries.fetchRewardItems.fetchRewardItems}
		getItemKey={(item: RewardItemRow) => item._id}
		class="gap-0 divide-y divide-border rounded-lg border px-4"
	>
		{#snippet item({ item }: { item: RewardItemRow; index: number })}
			<AdminRewardsItemRow {item} />
		{/snippet}

		{#snippet loading()}
			<AdminRewardsTableLoading />
		{/snippet}

		{#snippet empty()}
			<AdminRewardsTableEmpty />
		{/snippet}
	</ConvexDataList>
</div>
