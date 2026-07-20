<script lang="ts">
	import { RadioGroup } from 'bits-ui';
	import CircleIcon from '@lucide/svelte/icons/circle';
	import { cn } from '@/utils/utils.js';
	import { Field, FieldLabel } from '@/components/ui/field/index.js';
	import type { MutationFormFieldDef } from './types.js';

	let {
		field,
		inputId,
		value,
		setValue,
		invalid
	}: {
		field: MutationFormFieldDef;
		inputId: string;
		value: unknown;
		setValue: (next: unknown) => void;
		invalid: boolean;
	} = $props();

	const current = $derived((value as string | undefined) ?? '');
	const orientation = $derived(field.radioOrientation ?? 'vertical');
</script>

<RadioGroup.Root
	id={inputId}
	name={field.id}
	value={current}
	onValueChange={(v) => setValue(v)}
	disabled={field.disabled}
	required={field.required}
	{orientation}
	aria-invalid={invalid ? 'true' : undefined}
	data-slot="radio-group"
	class={cn('grid gap-3', orientation === 'horizontal' && 'auto-cols-max grid-flow-col')}
>
	{#each field.options ?? [] as opt (opt.value)}
		{@const itemId = `${inputId}-${opt.value}`}
		<Field orientation="horizontal">
			<RadioGroup.Item
				id={itemId}
				value={opt.value}
				disabled={opt.disabled}
				aria-invalid={invalid ? 'true' : undefined}
				class={cn(
					'border-input text-primary focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:bg-input/30 dark:aria-invalid:ring-destructive/40',
					'aspect-square size-4 shrink-0 rounded-full border shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50'
				)}
			>
				{#snippet children({ checked })}
					<div class="flex items-center justify-center">
						{#if checked}
							<CircleIcon class="size-2 fill-primary" />
						{/if}
					</div>
				{/snippet}
			</RadioGroup.Item>
			<FieldLabel for={itemId}>{opt.label}</FieldLabel>
		</Field>
	{/each}
</RadioGroup.Root>
