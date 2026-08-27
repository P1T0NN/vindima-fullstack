<script lang="ts">
	// COMPONENTS
	import {
		Empty,
		EmptyDescription,
		EmptyHeader,
		EmptyMedia,
		EmptyTitle,
	} from '@/components/ui/empty/index.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// EmptyData: a universal empty-state assembled from shadcn's <Empty>.
	// Title, description, optional icon and action are props — this component
	// only assembles them, the caller authors the text. Drop it straight into
	// a DataList `empty` snippet.
	let {
		title,
		description,
		icon,
		action,
		class: className,
	}: {
		/** Heading of the empty state, e.g. "No todos yet". */
		title?: string;
		/** Supporting copy under the title. */
		description?: string;
		/** Icon markup (lucide span, svg, ...) rendered in a muted chip above the title. */
		icon?: Snippet;
		/** Action below the copy, e.g. a <Button>. */
		action?: Snippet;
		class?: string;
	} = $props();
</script>

<Empty class={className}>
	{#if icon}
		<EmptyMedia variant="icon">
			{@render icon()}
		</EmptyMedia>
	{/if}
	<EmptyHeader>
		{#if title}
			<EmptyTitle>{title}</EmptyTitle>
		{/if}
		{#if description}
			<EmptyDescription>{description}</EmptyDescription>
		{/if}
	</EmptyHeader>
	{#if action}
		{@render action()}
	{/if}
</Empty>
