<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<!-- Mirrors the real row (thumb · name · price · action) so nothing jumps when data lands. -->
<div class="divide-y divide-border rounded-xl border bg-card px-4">
	{#each [0, 1, 2] as i (i)}
		<div class="flex items-center gap-3 py-3">
			<Skeleton class="size-10 shrink-0 rounded-md" />
			<div class="flex-1">
				<Skeleton class="h-4 w-40 max-w-full" />
			</div>
			<Skeleton class="h-4 w-14 shrink-0" />
			<Skeleton class="h-8 w-8 shrink-0 sm:w-24" />
		</div>
	{/each}
</div>
