<script lang="ts">
	import * as Select from '@/components/ui/select/index.js';
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

	const current = $derived(value as string | undefined);
	const triggerLabel = $derived(
		field.options?.find((o) => o.value === current)?.label ??
			field.selectPlaceholder ??
			field.placeholder ??
			'Select...'
	);
</script>

<Select.Root
	type="single"
	bind:value={() => current ?? '', (v) => setValue(v)}
	disabled={field.disabled}
>
	<Select.Trigger id={inputId} class="w-full" aria-invalid={invalid ? 'true' : undefined}>
		{triggerLabel}
	</Select.Trigger>
	<Select.Content>
		{#each field.options ?? [] as opt (opt.value)}
			<Select.Item value={opt.value} disabled={opt.disabled}>
				{opt.label}
			</Select.Item>
		{/each}
	</Select.Content>
</Select.Root>
