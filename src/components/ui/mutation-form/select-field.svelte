<script lang="ts">
	import { NativeSelect } from '@/components/ui/select/index.js';
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
</script>

<NativeSelect
	id={inputId}
	bind:value={() => current ?? '', (v) => setValue(v)}
	options={field.options ?? []}
	placeholder={field.selectPlaceholder ?? field.placeholder ?? 'Select...'}
	disabled={field.disabled}
	ariaInvalid={invalid}
	class="w-full"
/>
