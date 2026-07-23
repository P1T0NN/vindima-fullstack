<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// LUCIDE ICONS
	import ArrowUpRightIcon from '@lucide/svelte/icons/arrow-up-right';
	import ArrowDownRightIcon from '@lucide/svelte/icons/arrow-down-right';
	import MinusIcon from '@lucide/svelte/icons/minus';

	type Props = {
		/** Short label above the value (1–2 words). */
		label: string;
		/** Pre-formatted headline value — the largest text in the tile. */
		value: string;
		/**
		 * Optional delta chip. `sentiment` colors it by MEANING, not direction (an increase
		 * in refunds is bad); the arrow icon carries direction so color is never alone.
		 */
		delta?: { text: string; direction: 'up' | 'down' | 'flat'; sentiment: 'good' | 'bad' | 'neutral' };
		/** Muted footnote under the delta (e.g. "vs periodo anterior"). */
		note?: string;
		class?: string;
	};

	let { label, value, delta, note, class: className }: Props = $props();

	const sentimentClass = {
		good: 'bg-chart-2/15 text-chart-2',
		bad: 'bg-destructive/10 text-destructive',
		neutral: 'bg-muted text-muted-foreground'
	} as const;
</script>

<div
	class={cn(
		'flex flex-col gap-1.5 rounded-xl border border-primary/40 bg-card p-4 shadow-brand-subtle sm:p-5',
		className
	)}
>
	<span class="text-xs font-medium tracking-widest text-muted-foreground uppercase">{label}</span>

	<span class="font-display text-2xl leading-none font-semibold text-accent tabular-nums sm:text-3xl">
		{value}
	</span>

	{#if delta}
		<span
			class={cn(
				'mt-1 inline-flex w-fit items-center gap-1 rounded-sm px-1.5 py-0.5 text-xs font-medium tabular-nums',
				sentimentClass[delta.sentiment]
			)}
		>
			{#if delta.direction === 'up'}
				<ArrowUpRightIcon class="size-3.5" aria-hidden="true" />
			{:else if delta.direction === 'down'}
				<ArrowDownRightIcon class="size-3.5" aria-hidden="true" />
			{:else}
				<MinusIcon class="size-3.5" aria-hidden="true" />
			{/if}
			{delta.text}
		</span>
	{/if}

	{#if note}
		<span class="text-[0.65rem] text-muted-foreground">{note}</span>
	{/if}
</div>
