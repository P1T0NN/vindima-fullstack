<script lang="ts">
	// COMPONENTS
	import Input from '@/components/ui/input/input.svelte';
	import FormField from './form-field.svelte';

	// TYPES
	import type { InputField } from './formTypes.js';

	type Props = {
		field: InputField;
		value: string;
		disabled?: boolean;
		error?: string;
		onValueChange: (value: string) => void;
	};

	let { field, value, disabled = false, error, onValueChange }: Props = $props();
</script>

<FormField {field} {disabled} {error}>
	<Input
		id={field.name}
		name={field.name}
		type={field.type ?? 'text'}
		{value}
		maxlength={field.maxLength}
		placeholder={field.placeholder}
		required={field.required}
		aria-invalid={error ? 'true' : undefined}
		aria-describedby={error ? `${field.name}-error` : undefined}
		{disabled}
		oninput={(event) => onValueChange(event.currentTarget.value)}
	/>
</FormField>
