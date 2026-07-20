<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	const linePlaceholders = [0, 1];
</script>

<div class="flex flex-col gap-3 py-3" aria-busy="true" aria-label="Loading order summary">
	{#each linePlaceholders as index (index)}
		<div class="flex items-start justify-between gap-3">
			<div class="flex min-w-0 flex-1 flex-col gap-2">
				<Skeleton class="h-4 w-3/5 rounded-sm" />
				<Skeleton class="h-3 w-2/5 rounded-sm" />
			</div>
			<Skeleton class="h-4 w-14 shrink-0 rounded-sm" />
		</div>
	{/each}

	<div class="mt-2 flex flex-col gap-2 border-t pt-4">
		<Skeleton class="h-4 w-full rounded-sm" />
		<Skeleton class="h-4 w-full rounded-sm" />
		<Skeleton class="h-8 w-full rounded-sm" />
	</div>
</div>
