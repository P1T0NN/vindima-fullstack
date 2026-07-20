<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	// TYPES
	import type { EditProductVariantInput } from '@/shared/features/products/schemas/editProductSchemas';

	let { variants = $bindable() }: { variants: EditProductVariantInput[] } = $props();

	// New variants have no `variantId` (inserted on save); ref is editable + must be unique.
	function addVariant() {
		variants.push({
			ref: '',
			label: '',
			priceMinor: 0,
			available: true,
			sortOrder: variants.length
		});
	}
</script>

<Button type="button" variant="outline" size="sm" onclick={addVariant} class="self-start">
	Add variant
</Button>
