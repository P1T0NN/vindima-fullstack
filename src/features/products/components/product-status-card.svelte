<script lang="ts">
	// COMPONENTS
	import { Switch } from '@/components/ui/switch/index.js';
	import {
		Card,
		CardHeader,
		CardTitle,
		CardDescription,
		CardAction
	} from '@/components/ui/card/index.js';

	// TYPES
	import type { ProductFormStatus } from '@/shared/features/products/types/productsTypes';

	// One card for BOTH product forms (same pattern as `variant-form-card`): the switch
	// publishes the product (`active`) or keeps it private (`draft`).
	//
	// Archiving is NOT offered here — it's a deliberate action from the products table
	// (`setProductStatus`). An archived product gets a disabled, explanatory card and leaves
	// `status` undefined, so saving the form doesn't touch its status.
	let {
		status = $bindable(),
		archived = false
	}: {
		status: ProductFormStatus | undefined;
		archived?: boolean;
	} = $props();

	const titleId = $props.id();

	const isActive = $derived(status === 'active');

	// The description always states what the CURRENT state means — the switch position alone
	// doesn't tell the owner whether customers can see the product.
	const description = $derived(
		archived
			? 'Archivado: oculto en la tienda. Restáuralo desde la tabla de productos.'
			: isActive
				? 'Activo: visible en la tienda y disponible para comprar.'
				: 'Borrador: solo tú lo ves. Actívalo cuando esté listo para vender.'
	);

	function setActive(next: boolean) {
		status = next ? 'active' : 'draft';
	}

	// The whole card is a click target for the switch. Clicks that land ON the switch are
	// already handled by it — without this guard they'd toggle twice and cancel out.
	function onCardClick(event: MouseEvent) {
		if (archived) return;
		const target = event.target as HTMLElement | null;
		if (target?.closest('[data-slot="switch"]')) return;
		setActive(!isActive);
	}
</script>

<Card role="presentation" onclick={onCardClick} class={archived ? undefined : 'cursor-pointer'}>
	<CardHeader>
		<CardTitle id={titleId}>Estado del producto</CardTitle>
		<CardDescription>{description}</CardDescription>

		<CardAction>
			<Switch
				checked={isActive}
				onCheckedChange={setActive}
				disabled={archived}
				aria-labelledby={titleId}
			/>
		</CardAction>
	</CardHeader>
</Card>
