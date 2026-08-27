<script lang="ts">
	// COMPONENTS
	import { Field, FieldDescription } from '@/components/ui/field/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { RadioField } from './formTypes.js';

	type Props = {
		field: RadioField;
		value: string;
		disabled?: boolean;
		onValueChange: (value: string) => void;
	};

	let { field, value, disabled = false, onValueChange }: Props = $props();
	const isDisabled = $derived(disabled || field.disabled === true);
</script>

<Field class={field.class} data-disabled={isDisabled}>
	<fieldset class="flex min-w-0 flex-col gap-3" disabled={isDisabled}>
		{#if field.label}
			<legend class="text-sm font-medium">
				{field.label}{#if field.required}<span class="text-destructive"> *</span>{/if}
			</legend>
		{/if}

		<div
			class={cn(
				field.radioOrientation === 'horizontal'
					? 'grid grid-cols-1 gap-3 sm:grid-cols-2'
					: 'flex flex-col gap-3'
			)}
		>
			{#each field.options as option (option.value)}
				<label for={`${field.name}-${option.value}`} class="flex items-center gap-2 text-sm">
					<input
						id={`${field.name}-${option.value}`}
						name={field.name}
						type="radio"
						value={option.value}
						checked={value === option.value}
						required={field.required}
						disabled={isDisabled || option.disabled}
						onchange={() => onValueChange(option.value)}
					/>
					<span>{option.label}</span>
				</label>
			{/each}
		</div>

		{#if field.description}
			<FieldDescription>{field.description}</FieldDescription>
		{/if}
	</fieldset>
</Field>
