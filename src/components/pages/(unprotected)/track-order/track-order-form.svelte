<script lang="ts">
	// LIBRARIES
	import { useConvexClient } from '@mmailaender/convex-svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import MutationForm from '@/components/ui/mutation-form/mutation-form.svelte';

	// SCHEMAS
	import { trackOrderFormSchema } from '@/shared/features/orders/schemas/ordersSchemas.js';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';

	// TYPES
	import type { MutationFormFieldDef } from '@/components/ui/mutation-form/types.js';
	import type { TrackOrderFormInput } from '@/shared/features/orders/schemas/ordersSchemas.js';

	/**
	 * Guest order lookup — the two things that together prove possession of a confirmation.
	 * Both are enforced server-side (`fetchOrderByNumber`); this form is the courtesy, not the
	 * gate. On a hit it hands off to the existing order view rather than rendering a second one.
	 *
	 * `MutationForm`, not `ConvexMutationForm`: the lookup is a QUERY, and the Convex wrapper is
	 * typed to (and calls) mutations. `onSubmit` is the seam both share, so this gets the same
	 * fields, validation, busy state and error rendering without widening a shared primitive for
	 * one caller.
	 */
	const convex = useConvexClient();

	let values = $state<TrackOrderFormInput>({ number: '', email: '' });
	let notFound = $state(false);

	const fields: MutationFormFieldDef[] = [
		{
			id: 'number',
			label: 'Número de pedido',
			kind: 'input',
			placeholder: 'ORD-8B66KY',
			autocomplete: 'off',
			fieldClass: '[&_input]:uppercase'
		},
		{
			id: 'email',
			label: 'Correo electrónico',
			kind: 'input',
			type: 'email',
			placeholder: 'tu@correo.com',
			autocomplete: 'email'
		}
	];

	/** `false` keeps the form filled so the shopper can correct a typo rather than retype both. */
	async function lookup(_args: Record<string, unknown>, input: TrackOrderFormInput) {
		notFound = false;
		try {
			const order = await convex.query(
				api.tables.orders.queries.fetchOrderByNumber.fetchOrderByNumber,
				{ number: input.number, email: input.email }
			);

			if (!order) {
				notFound = true;
				return false;
			}

			await appGoto(
				`${UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT_SUCCESS}?order=${order.id}&email=${encodeURIComponent(input.email.trim())}`
			);
			return true;
		} catch (error) {
			console.error('[track-order] lookup failed', error);
			notFound = true;
			return false;
		}
	}
</script>

<MutationForm
	class="mt-9"
	{fields}
	bind:values
	schema={trackOrderFormSchema}
	onSubmit={lookup}
	submitLabel="Ver mi pedido"
	resetOnSuccess={false}
	{extraFields}
/>

<!-- A miss is not a field error — number and email are individually plausible, they just don't
     name an order together. So it renders once, below both, and says what to re-check. -->
{#snippet extraFields()}
	{#if notFound}
		<p class="text-sm leading-relaxed text-destructive" role="alert">
			No encontramos un pedido con esos datos. Revisa el número y el correo: deben coincidir con los
			de tu confirmación.
		</p>
	{/if}
{/snippet}
