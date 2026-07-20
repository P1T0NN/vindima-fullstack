<script lang="ts">
	import { Textarea } from '@/components/ui/textarea/index.js';
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
</script>

<Textarea
	id={inputId}
	name={field.id}
	placeholder={field.placeholder}
	rows={field.rows}
	autocomplete={field.autocomplete}
	disabled={field.disabled}
	required={field.required}
	value={value as string | undefined}
	oninput={(e) => setValue(e.currentTarget.value)}
	aria-invalid={invalid ? 'true' : undefined}
/>
