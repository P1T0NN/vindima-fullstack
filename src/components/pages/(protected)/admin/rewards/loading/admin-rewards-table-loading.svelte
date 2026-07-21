<script lang="ts">
	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';
</script>

<div class="flex flex-col gap-3">
	{#each [0, 1, 2] as i (i)}
		<Skeleton class="h-14 w-full" />
	{/each}
</div>
