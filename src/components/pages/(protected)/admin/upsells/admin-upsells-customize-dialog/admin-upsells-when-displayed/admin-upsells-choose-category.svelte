<script lang="ts">
	// Category trigger picker — NativeSelect over the one-shot category options hook.

	// COMPONENTS
	import { NativeSelect } from '@/components/ui/select/index.js';

	// HOOKS
	import { useCategoryOptions } from '@/features/productCategories/hooks/useCategoryOptions.svelte';

	let { value = $bindable('') }: { value?: string } = $props();

	const categoryOptions = useCategoryOptions();
</script>

<NativeSelect
	bind:value
	options={categoryOptions.options}
	placeholder="Elige una categoría..."
	ariaLabel="Categoría"
	class="mt-1 w-full"
/>
