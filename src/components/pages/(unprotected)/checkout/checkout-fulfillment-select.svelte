<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { MutationFormSelectOption } from '@/components/ui/mutation-form/types';

	// LUCIDE ICONS
	import StoreIcon from '@lucide/svelte/icons/store';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		options,
		selected,
		name,
		onselect
	}: {
		/** Enabled fulfillment modes (from config) — value + display label. */
		options: MutationFormSelectOption[];
		/** Currently picked value. */
		selected: string;
		/** Radio group name (shared across the cards for native keyboard nav). */
		name: string;
		onselect: (value: string) => void;
	} = $props();

	// Presentation per fulfillment value the server understands. Unknown values still render
	// (label only, no icon/blurb), so this never breaks if a new mode is added to config.
	const META: Record<string, { icon: typeof StoreIcon; description: string }> = {
		pickup: {
			icon: StoreIcon,
			description: "Collect your order in store when it's ready. No delivery fee."
		},
		delivery: {
			icon: TruckIcon,
			description: 'We deliver to the address you provide below.'
		}
	};
</script>

<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
	{#each options as option (option.value)}
		{@const meta = META[option.value]}
		{@const Icon = meta?.icon}
		{@const isSelected = selected === option.value}
		
		<label
			class={cn(
				'relative flex cursor-pointer gap-3 rounded-xl border p-4 transition-all',
				'has-focus-visible:ring-2 has-focus-visible:ring-ring',
				isSelected
					? 'border-primary bg-primary/12 ring-1 ring-primary shadow-sm'
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
				<span class="text-sm font-medium text-foreground">{option.label}</span>
				{#if meta}
					<span class="text-xs leading-snug text-muted-foreground">{meta.description}</span>
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
