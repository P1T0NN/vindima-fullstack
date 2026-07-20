<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
	import CheckoutSummaryLoading from './checkout-summary-loading.svelte';

	// Mirrors the checkout form's two-column layout so content swaps in without a jump.
	const contactFields = [0, 1, 2];
</script>

<div class="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8" aria-busy="true">
	<!-- LEFT: form sections -->
	<div class="flex flex-col gap-6">
		<!-- Your details -->
		<div class="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<Skeleton class="h-5 w-32 rounded-sm" />
			<div class="grid gap-4 sm:grid-cols-2">
				{#each contactFields as index (index)}
					<div class="flex flex-col gap-2 {index === 2 ? 'sm:col-span-2' : ''}">
						<Skeleton class="h-3 w-20 rounded-sm" />
						<Skeleton class="h-9 w-full rounded-md" />
					</div>
				{/each}
			</div>
		</div>

		<!-- Delivery -->
		<div class="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<Skeleton class="h-5 w-24 rounded-sm" />
			<div class="grid gap-3 sm:grid-cols-2">
				<Skeleton class="h-20 w-full rounded-xl" />
				<Skeleton class="h-20 w-full rounded-xl" />
			</div>
			<div class="flex flex-col gap-2">
				<Skeleton class="h-3 w-24 rounded-sm" />
				<Skeleton class="h-16 w-full rounded-md" />
			</div>
		</div>
	</div>

	<!-- RIGHT: summary -->
	<aside class="mt-6 lg:mt-0">
		<div class="flex flex-col gap-4 rounded-xl border bg-card p-5">
			<Skeleton class="h-5 w-32 rounded-sm" />
			<CheckoutSummaryLoading />
		</div>
		<Skeleton class="mt-4 h-12 w-full rounded-md" />
	</aside>
</div>
