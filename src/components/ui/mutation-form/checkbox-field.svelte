<script lang="ts">
	import { Checkbox } from '@/components/ui/checkbox/index.js';
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

	const checked = $derived(value === true);
</script>

<Checkbox
	id={inputId}
	name={field.id}
	{checked}
	onCheckedChange={(v) => setValue(v)}
	disabled={field.disabled}
	required={field.required}
	aria-invalid={invalid ? 'true' : undefined}
/>
