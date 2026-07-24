<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import ChevronDownIcon from '@lucide/svelte/icons/chevron-down';

	// TYPES
	import type { Snippet } from 'svelte';

	type Item = {
		/** Header text, or a snippet for custom markup. */
		heading: string | Snippet;
		/** Panel content, or a snippet for custom markup. */
		content: string | Snippet;
		/** Start expanded. In single-open mode only the last `open` item wins. */
		open?: boolean;
		disabled?: boolean;
	};

	type Props = {
		items: Item[];
		/** Allow more than one item open at once. Default: single-open (opening one closes the rest). */
		multiple?: boolean;
		class?: string;
	};

	let { items, multiple = false, class: className }: Props = $props();

	// A shared `name` groups the <details> so the browser keeps only one open (native exclusive accordion).
	// Omitting the name in `multiple` mode lets any number stay open. Unique per instance to avoid
	// collisions with other accordions on the page.
	const uid = $props.id();
	
	// svelte-ignore state_referenced_locally
	const name = multiple ? undefined : uid;

	const isSnippet = (v: string | Snippet): v is Snippet => typeof v === 'function';
</script>

<div class={cn('accordion divide-y divide-border rounded-lg border', className)}>
	{#each items as item (item)}
		<details {name} open={item.open} class="accordion__item group">
			<summary
				class="accordion__summary flex cursor-pointer items-center justify-between gap-4 px-4 py-4 text-sm font-medium select-none hover:underline aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
				aria-disabled={item.disabled || undefined}
				onclick={(e) => item.disabled && e.preventDefault()}
			>
				{#if isSnippet(item.heading)}
					{@render item.heading()}
				{:else}
					{item.heading}
				{/if}

				<ChevronDownIcon
					class="size-4 shrink-0 text-muted-foreground transition-transform duration-200 group-open:rotate-180"
				/>
			</summary>

			<div class="accordion__content px-4 pb-4 text-sm text-muted-foreground">
				{#if isSnippet(item.content)}
					{@render item.content()}
				{:else}
					{item.content}
				{/if}
			</div>
		</details>
	{/each}
</div>

<style>
	/* Animate open/close natively; snaps gracefully where ::details-content isn't supported. */
	.accordion {
		interpolate-size: allow-keywords;
	}

	.accordion__summary::-webkit-details-marker {
		display: none;
	}

	.accordion__summary {
		list-style: none;
	}

	.accordion__item::details-content {
		block-size: 0;
		overflow: hidden;
		transition:
			block-size 0.2s ease,
			content-visibility 0.2s ease allow-discrete;
	}

	.accordion__item[open]::details-content {
		block-size: auto;
	}
</style>
