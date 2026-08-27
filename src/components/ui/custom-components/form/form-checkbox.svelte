<script lang="ts">
	// COMPONENTS
	import Checkbox from '@/components/ui/checkbox/checkbox.svelte';
	import FormField from './form-field.svelte';

	// TYPES
	import type { CheckboxField } from './formTypes.js';

	type Props = {
		field: CheckboxField;
		checked: boolean;
		disabled?: boolean;
		onCheckedChange: (checked: boolean) => void;
	};

	let { field, checked, disabled = false, onCheckedChange }: Props = $props();
</script>

<FormField {field} {disabled} labelPosition="after">
	<Checkbox
		id={field.name}
		name={field.name}
		{checked}
		{disabled}
		onCheckedChange={(value) => onCheckedChange(value === true)}
	/>
</FormField>
