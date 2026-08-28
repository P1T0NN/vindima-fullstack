<script lang="ts">
	// COMPONENTS
	import {
		Field,
		FieldContent,
		FieldDescription,
		FieldError,
		FieldLabel
	} from '@/components/ui/field/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { FormControlField, UploadField } from './formTypes.js';

	type Props = {
		field: FormControlField | UploadField;
		disabled?: boolean;
		labelPosition?: 'before' | 'after';
		error?: string;
		class?: string;
		children?: Snippet;
	};

	let {
		field,
		disabled = false,
		labelPosition = 'before',
		error,
		class: className,
		children
	}: Props = $props();
</script>

	<Field
		class={cn(labelPosition === 'after' && 'flex-row items-center gap-2', field.class, className)}
		data-disabled={disabled}
		data-invalid={error ? 'true' : undefined}
	>
	{#if labelPosition === 'before' && field.label}
		<FieldLabel for={field.name}>
			{field.label}{#if field.required}<span class="text-destructive"> *</span>{/if}
		</FieldLabel>
	{/if}

	<FieldContent>
		{@render children?.()}
		{#if field.description}<FieldDescription>{field.description}</FieldDescription>{/if}
		{#if error}
			<FieldError id={`${field.name}-error`}>{error}</FieldError>
		{/if}
	</FieldContent>

	{#if labelPosition === 'after' && field.label}
		<FieldLabel for={field.name}>
			{field.label}{#if field.required}<span class="text-destructive"> *</span>{/if}
		</FieldLabel>
	{/if}
</Field>
