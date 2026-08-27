<script lang="ts">
	// COMPONENTS
	import { Card } from '@/components/ui/card/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// PROPERTIES
	let {
		rows = 5,
		borderless = false,
		class: className
	}: {
		/** Number of skeleton rows to render. */
		rows?: number;
		/** When true, renders bare skeleton rows without the card shell. */
		borderless?: boolean;
		class?: string;
	} = $props();
</script>

{#snippet skeleton()}
	{#each Array(rows)}
		<div class="flex items-center gap-4 border-b p-3 last:border-0">
			<Skeleton class="h-4 w-8" />
			<Skeleton class="h-4 flex-1" />
			<Skeleton class="h-4 flex-1" />
			<Skeleton class="ml-auto h-4 w-16" />
		</div>
	{/each}
{/snippet}

{#if borderless}
	<div class={className}>{@render skeleton()}</div>
{:else}
	<Card class={cn('overflow-hidden rounded-none rounded-b-4xl', className)}
		>{@render skeleton()}</Card
	>
{/if}
