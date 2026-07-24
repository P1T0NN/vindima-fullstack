<script lang="ts">
	// The three trigger-type cards: product · category · global.

	// COMPONENTS
	import { CardSelect } from '@/components/ui/card-select/index.js';

	// TYPES
	import type { UpsellTrigger } from '@/shared/features/upsells/types/upsellsTypes';

	// LUCIDE ICONS
	import PackageIcon from '@lucide/svelte/icons/package';
	import TagIcon from '@lucide/svelte/icons/tag';
	import StoreIcon from '@lucide/svelte/icons/store';

	let { kind = $bindable('product') }: { kind?: UpsellTrigger['kind'] } = $props();

	const KIND_META = {
		product: { icon: PackageIcon, description: 'Al agregar un producto específico.' },
		category: { icon: TagIcon, description: 'Al agregar cualquier producto de una categoría.' },
		global: { icon: StoreIcon, description: 'Al agregar cualquier producto.' }
	};

	const kindOptions = [
		{ value: 'product', label: 'Un producto' },
		{ value: 'category', label: 'Una categoría' },
		{ value: 'global', label: 'Cualquiera' }
	];
</script>

<CardSelect
	options={kindOptions}
	selected={kind}
	name="upsell-trigger-kind"
	meta={KIND_META}
	onselect={(v) => (kind = v as typeof kind)}
/>
