<script lang="ts">
	// CONFIG
	import { CART_CONFIG } from '@/shared/config';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Card } from '@/components/ui/card/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Switch } from '@/components/ui/switch/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import {
		Field,
		FieldLabel,
		FieldError,
		FieldDescription
	} from '@/components/ui/field/index.js';

	// UTILS
	import { toMinorUnits, fromMinorUnits } from '@/utils/formatters.js';
	import { suggestVariantRef } from '@/shared/features/productVariants/utils/productVariantsUtils';

	// TYPES
	import type { EditProductVariantInput } from '@/shared/features/productVariants/schemas/productVariantsSchemas';

	// One card for BOTH product forms: on add, `variantId` is always absent so the ref stays
	// editable; on edit, a saved variant carries its id and the ref locks (shipped contract).
	let {
		index,
		variant = $bindable(),
		canRemove = false,
		onRemove,
		errors = {},
		refBase = ''
	}: {
		index: number;
		variant: EditProductVariantInput;
		canRemove?: boolean;
		onRemove?: () => void;
		/** This row's validation errors, keyed by variant property (`zodIssuesForArrayItem`). */
		errors?: Record<string, string>;
		/** Product slug/name the reference suggestion derives from. */
		refBase?: string;
	} = $props();

	const toMinor = (major: number) => toMinorUnits(major, CART_CONFIG.CURRENCY);
	const toMajor = (minor: number) => fromMinorUnits(minor, CART_CONFIG.CURRENCY);

	// A saved variant's ref is a shipped public contract — immutable once created.
	const refLocked = $derived(!!variant.variantId);

	// Auto-fill the reference from product + label until the admin types their own — most
	// admins won't know what a "reference" should look like. Programmatic writes don't fire
	// `oninput`, so only real typing flips the flag.
	let refDirty = $state(!!variant.ref);
	$effect(() => {
		if (refDirty || refLocked) return;
		const suggested = suggestVariantRef(refBase, variant.label);
		if (variant.ref !== suggested) variant.ref = suggested;
	});
</script>

<Card class="gap-3 rounded-lg p-3 shadow-none">
	<div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
		<Field>
			<FieldLabel for="ref-{index}">Ref</FieldLabel>
			<Input
				id="ref-{index}"
				bind:value={variant.ref}
				placeholder="tabla-quesos-grande"
				disabled={refLocked}
				oninput={() => (refDirty = true)}
				aria-invalid={errors.ref ? 'true' : undefined}
			/>
			{#if errors.ref}
				<FieldError>{errors.ref}</FieldError>
			{:else}
				<FieldDescription>
					{#if refLocked}
						Bloqueada — este código ya se usa en pedidos y carritos anteriores, así que no puede
						cambiarse.
					{:else}
						Código breve que identifica esta opción — se rellena automáticamente a partir del
						producto y la etiqueta. Los clientes no lo ven y, una vez guardado, no se puede
						cambiar.
					{/if}
				</FieldDescription>
			{/if}
		</Field>

		<Field>
			<FieldLabel for="price-{index}">
				Precio {CART_CONFIG.CURRENCY}
			</FieldLabel>

			<Input
				id="price-{index}"
				type="number"
				step="any"
				min="0"
				placeholder="120.00"
				aria-invalid={errors.priceMinor ? 'true' : undefined}
				bind:value={
					() => (variant.priceMinor ? toMajor(variant.priceMinor) : undefined),
					(v) => (variant.priceMinor = toMinor(Number(v) || 0))
				}
			/>
			{#if errors.priceMinor}
				<FieldError>{errors.priceMinor}</FieldError>
			{/if}
		</Field>
	</div>

	<Field>
		<FieldLabel for="label-{index}">Etiqueta</FieldLabel>
		<Input id="label-{index}" bind:value={variant.label} placeholder="Grande" />
		<FieldDescription>
			Opcional — nombre de la opción que ven los clientes (Pequeño, Grande, Copa, Botella…).
			Déjalo vacío si el producto solo se vende en una opción.
		</FieldDescription>
	</Field>

	<!-- Toggle on its own row — never inline with inputs. -->
	<div class="flex items-center gap-2">
		<Switch id="available-{index}" bind:checked={variant.available} />
		<Label for="available-{index}">Disponible</Label>
	</div>

	{#if canRemove && onRemove}
		<Button type="button" variant="ghost" size="sm" class="self-end" onclick={onRemove}>
			Eliminar
		</Button>
	{/if}
</Card>
