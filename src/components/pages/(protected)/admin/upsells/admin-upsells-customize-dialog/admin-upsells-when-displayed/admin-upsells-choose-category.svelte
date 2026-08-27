<script lang="ts">
	// Category trigger picker — shadcn Select over the one-shot category options hook.

	// COMPONENTS
	import * as Select from '@/components/ui/select/index.js';

	// HOOKS
	import { useCategoryOptions } from '@/features/productCategories/hooks/useCategoryOptions.svelte';

	let { value = $bindable('') }: { value?: string } = $props();

	const categoryOptions = useCategoryOptions();
	const triggerContent = $derived(
		categoryOptions.options.find((option) => option.value === value)?.label ??
			'Elige una categoría...'
	);
</script>

<Select.Root type="single" bind:value>
	<Select.Trigger class="mt-1 w-full" aria-label="Categoría">
		{triggerContent}
	</Select.Trigger>
	<Select.Content>
		<Select.Group>
			<Select.Label>Categorías</Select.Label>
			{#each categoryOptions.options as option (option.value)}
				<Select.Item value={option.value} label={option.label}>
					{option.label}
				</Select.Item>
			{/each}
		</Select.Group>
	</Select.Content>
</Select.Root>
