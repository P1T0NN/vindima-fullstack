<script lang="ts">
	// Variant autocomplete for the item picker: type → pick → the parent adds a chip. One-shot
	// search via SearchInputConvex over `fetchProductVariantsForSearch`. Disabled at the cap.

	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { CART_CONFIG } from '@/shared/config.js';

	// COMPONENTS
	import { SearchInputConvex } from '@/components/ui/search-input/index.js';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { formatVariantName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	let {
		excludeSlug = '',
		disabled = false,
		onAdd
	}: {
		/** Trigger product slug to drop — a product can't upsell itself. */
		excludeSlug?: string;
		/** True at the selection cap — blocks adding more. */
		disabled?: boolean;
		onAdd: (ref: string, label: string) => void;
	} = $props();

	/** Cleared on every pick: the chip below is the record of the choice, so the field starts
	 *  fresh for the next one instead of holding a term whose result is already taken. */
	let search = $state('');

	const money = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);

	// One row per sellable variant: its `ref` is the id upsell rules store; price rides the
	// description line, and the product's cover fills the dropdown's leading square.
	const toItem = (row: {
		ref: string;
		productName: string;
		variantLabel: string | null;
		priceMinor: number;
		imageUrl: string | null;
	}) => ({
		id: row.ref,
		title: formatVariantName(row.productName, row.variantLabel),
		description: money(row.priceMinor),
		imageUrl: row.imageUrl ?? undefined
	});
</script>

<SearchInputConvex
	bind:value={search}
	query={api.tables.productVariants.queries.fetchProductVariantsForSearch
		.fetchProductVariantsForSearch}
	queryArgs={{ excludeSlug }}
	mapItem={toItem}
	minQueryLength={2}
	selectValueOnSelect={false}
	{disabled}
	placeholder="Buscar productos..."
	class="max-w-none"
	onSelect={(item) => {
		onAdd(item.id, item.title);
		search = '';
	}}
/>
