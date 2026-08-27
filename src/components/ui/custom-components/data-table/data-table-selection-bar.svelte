<script lang="ts">
	// SVELTEKIT IMPORTS
	import { fly } from 'svelte/transition';

	// COMPONENTS
	import { Button } from '@/components/ui/button';

	// TYPES
	import type { Snippet } from 'svelte';

	let {
		count,
		selectedKeys,
		onClear,
		actions
	}: {
		/** How many rows are currently selected. */
		count: number;
		/** The currently selected keys — handed to the actions snippet. */
		selectedKeys: ReadonlySet<PropertyKey>;
		/** Called when the user clears the selection. */
		onClear: () => void;
		/** Custom bulk actions rendered next to Clear (e.g. a delete button). Fully custom — wire it to your own mutation. */
		actions?: Snippet<
			[{ selectedKeys: ReadonlySet<PropertyKey>; count: number; onClear: () => void }]
		>;
	} = $props();
</script>

<div
	role="status"
	transition:fly={{ y: -6, duration: 150 }}
	class="my-3 flex items-center justify-between gap-3 rounded-xl border border-primary/20 bg-primary/10 px-4 py-2.5"
>
	<span class="flex items-center gap-2.5 text-sm">
		<span class="grid size-5 place-content-center rounded-full bg-primary text-primary-foreground">
			<span class="icon-[lucide--check] size-3"></span>
		</span>
		<span class="text-muted-foreground">Selected</span>

		<span class="font-semibold text-foreground">{count} {count === 1 ? 'item' : 'items'}</span>
	</span>

	<div class="flex items-center gap-2">
		{#if actions}
			{@render actions({ selectedKeys, count, onClear })}
		{/if}
		<Button
			variant="outline"
			size="xs"
			title="Clear selection"
			class="text-muted-foreground hover:bg-primary/10 hover:text-foreground"
			onclick={onClear}
		>
			<span class="icon-[lucide--x] size-3.5"></span>
			Clear
		</Button>
	</div>
</div>
