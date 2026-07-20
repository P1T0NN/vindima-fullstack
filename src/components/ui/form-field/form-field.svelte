<script lang="ts">
	import { Field, FieldLabel, FieldError, FieldDescription } from '@/components/ui/field/index.js';
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';
	import type { Snippet } from 'svelte';

	let {
		ref = $bindable(null),
		id,
		label,
		error,
		description,
		class: className,
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLDivElement>> & {
		id: string;
		label: string;
		error?: string;
		description?: string;
		children: Snippet;
	} = $props();
</script>

<Field class={cn(className)} bind:ref {...restProps}>
	<FieldLabel for={id}>{label}</FieldLabel>
	{@render children()}
	{#if error}
		<FieldError>{error}</FieldError>
	{:else if description}
		<FieldDescription>{description}</FieldDescription>
	{/if}
</Field>
