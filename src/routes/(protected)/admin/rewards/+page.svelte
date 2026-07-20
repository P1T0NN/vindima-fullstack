<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { PAGINATION_DATA, REWARDS_CONFIG } from '@/shared/config';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import RewardsAddForm from '@/components/pages/(protected)/admin/rewards/rewards-add-form.svelte';
	import RewardsItemRow from '@/components/pages/(protected)/admin/rewards/rewards-item-row.svelte';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';

	// The page's ONE subscription — current rewards AND picker candidates derive from it.
	const catalogQuery = useQuery(
		api.tables.products.queries.fetchRewardCatalog.fetchRewardCatalog,
		() => ({ paginationOpts: { numItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE, cursor: null } })
	);
	const catalog = $derived(catalogQuery.data?.page as AdminProductRow[] | undefined);

	// Current reward items: any status (archived ones show a "not purchasable" hint).
	const rewardItems = $derived(
		(catalog ?? []).flatMap((product) =>
			product.variants
				.filter((variant) => variant.rewardEligible === true)
				.map((variant) => ({ product, variant }))
		)
	);

	// Picker candidates: active products with ≥1 available, not-yet-reward variant.
	const candidates = $derived(
		(catalog ?? []).filter(
			(product) =>
				product.status === 'active' &&
				product.variants.some((variant) => variant.available && variant.rewardEligible !== true)
		)
	);
</script>

<SvelteHead title="Rewards" />

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Rewards</h1>
		<p class="text-sm text-muted-foreground">
			Customers earn a free item after every {REWARDS_CONFIG.STAMPS_PER_REWARD} purchases. Choose which
			items they can pick below.
		</p>
	</header>

	{#if catalogQuery.error}
		<ErrorComponent
			variant="alert"
			title="Failed to load reward items"
			description="Something went wrong while fetching the catalog. Please try again."
		/>
	{:else if catalog === undefined}
		<div class="flex flex-col gap-3">
			<Skeleton class="h-16 w-full max-w-lg" />
			{#each [0, 1, 2] as i (i)}
				<Skeleton class="h-14 w-full" />
			{/each}
		</div>
	{:else}
		<RewardsAddForm {candidates} />

		{#if rewardItems.length === 0}
			<div class="rounded-lg border border-dashed px-6 py-12 text-center">
				<p class="text-sm text-muted-foreground">
					No reward items yet. Customers can't claim their free item until you add at least one.
				</p>
			</div>
		{:else}
			<div class="flex flex-col gap-2">
				<h2 class="text-sm font-semibold">Current reward items ({rewardItems.length})</h2>
				<ul class="flex flex-col divide-y divide-border rounded-lg border px-4">
					{#each rewardItems as { product, variant } (variant._id)}
						<RewardsItemRow {variant} {product} />
					{/each}
				</ul>
			</div>
		{/if}
	{/if}
</section>
