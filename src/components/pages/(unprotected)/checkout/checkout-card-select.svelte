<script lang="ts">
	// Generic card-radio picker for checkout choices (fulfillment mode, payment method, …).
	// One selected card, native radio = mutual exclusion + keyboard nav for free. Per-value
	// icon + blurb come from a `meta` map; a disabled option renders greyed and unpickable
	// (e.g. an "online payment" card shown before the provider is wired).

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { MutationFormSelectOption } from '@/components/ui/mutation-form/types';
	import type { Component } from 'svelte';

	// LUCIDE ICONS
	import CheckIcon from '@lucide/svelte/icons/check';

	type CardMeta = { icon?: Component; description?: string };

	let {
		options,
		selected,
		name,
		meta = {},
		onselect
	}: {
		/** Selectable values — value + display label (+ optional `disabled`). */
		options: MutationFormSelectOption[];
		/** Currently picked value. */
		selected: string;
		/** Radio group name (shared across the cards for native keyboard nav). */
		name: string;
		/** Per-value icon + blurb. Missing entries render label-only — never breaks. */
		meta?: Record<string, CardMeta>;
		onselect: (value: string) => void;
	} = $props();
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
	{#each options as option (option.value)}
		{@const m = meta[option.value]}
		{@const Icon = m?.icon}
		{@const isSelected = selected === option.value}

		<label
			class={cn(
				'relative flex gap-3 rounded-xl border p-4 transition-all',
				option.disabled
					? 'cursor-not-allowed opacity-55'
					: 'cursor-pointer has-focus-visible:ring-2 has-focus-visible:ring-ring',
				isSelected
					? 'border-primary bg-primary/12 shadow-sm ring-1 ring-primary'
					: option.disabled
						? 'border-border'
						: 'border-border hover:border-primary/40 hover:bg-muted/40'
			)}
		>
			<input
				type="radio"
				{name}
				value={option.value}
				checked={isSelected}
				disabled={option.disabled}
				class="sr-only"
				onchange={() => onselect(option.value)}
			/>

			{#if Icon}
				<span class={cn('mt-0.5 shrink-0', isSelected ? 'text-primary' : 'text-muted-foreground')}>
					<Icon class="size-5" strokeWidth={1.6} />
				</span>
			{/if}

			<span class="flex flex-col gap-0.5">
				<span class="flex items-center gap-2 text-sm font-medium text-foreground">
					{option.label}
					{#if option.disabled}
						<span
							class="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-medium tracking-wide text-muted-foreground uppercase"
						>
							Próximamente
						</span>
					{/if}
				</span>
				{#if m?.description}
					<span class="text-xs leading-snug text-muted-foreground">{m.description}</span>
				{/if}
			</span>

			{#if isSelected}
				<span
					class="absolute top-3 right-3 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground"
				>
					<CheckIcon class="size-3" strokeWidth={3} />
				</span>
			{/if}
		</label>
	{/each}
</div>
