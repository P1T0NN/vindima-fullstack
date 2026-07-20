<script lang="ts">
	// CONFIG
	import { CART_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Card } from '@/components/ui/card/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Switch } from '@/components/ui/switch/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import { Field, FieldLabel } from '@/components/ui/field/index.js';

	// UTILS
	import { toMinorUnits, fromMinorUnits } from '@/utils/formatters.js';

	// TYPES
	import type { EditProductVariantInput } from '@/shared/features/products/schemas/editProductSchemas';

	let {
		index,
		variant = $bindable(),
		canRemove = false,
		onRemove
	}: {
		index: number;
		variant: EditProductVariantInput;
		canRemove?: boolean;
		onRemove?: () => void;
	} = $props();

	const toMinor = (major: number) => toMinorUnits(major, CART_CONFIG.CURRENCY);
	const toMajor = (minor: number) => fromMinorUnits(minor, CART_CONFIG.CURRENCY);

	// A saved variant's ref is a shipped public contract — immutable once created.
	const refLocked = $derived(!!variant.variantId);
</script>

<Card class="gap-3 rounded-lg p-3 shadow-none">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<Field>
			<FieldLabel for="ref-{index}">Reference</FieldLabel>
			<Input id="ref-{index}" bind:value={variant.ref} placeholder="boards-1-M" disabled={refLocked} />
		</Field>

		<Field>
			<FieldLabel for="price-{index}">
				Price {CART_CONFIG.CURRENCY}
			</FieldLabel>

			<Input
				id="price-{index}"
				type="number"
				step="any"
				min="0"
				placeholder="120.00"
				bind:value={
					() => (variant.priceMinor ? toMajor(variant.priceMinor) : undefined),
					(v) => (variant.priceMinor = toMinor(Number(v) || 0))
				}
			/>
		</Field>
	</div>

	<Field>
		<FieldLabel for="label-{index}">Label</FieldLabel>
		<Input id="label-{index}" bind:value={variant.label} placeholder="M" />
	</Field>

	<!-- Toggle on its own row — never inline with inputs. -->
	<div class="flex items-center gap-2">
		<Switch id="available-{index}" bind:checked={variant.available} />
		<Label for="available-{index}">Available</Label>
	</div>

	{#if canRemove && onRemove}
		<Button type="button" variant="ghost" size="sm" class="self-end" onclick={onRemove}>
			Remove
		</Button>
	{/if}
</Card>
