<script lang="ts">
	// COMPONENTS
	import Textarea from '@/components/ui/textarea/textarea.svelte';
	import FormField from './form-field.svelte';

	// TYPES
	import type { TextareaField } from './formTypes.js';

	type Props = {
		field: TextareaField;
		value: string;
		disabled?: boolean;
		onValueChange: (value: string) => void;
	};

	let { field, value, disabled = false, onValueChange }: Props = $props();
</script>

<FormField {field} {disabled}>
	<Textarea
		id={field.name}
		name={field.name}
		{value}
		placeholder={field.placeholder}
		required={field.required}
		{disabled}
		oninput={(event) => onValueChange(event.currentTarget.value)}
	/>
</FormField>
