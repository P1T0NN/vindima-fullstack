<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { api } from '@/convex/_generated/api';

	// CLASSES
	import { cart } from '@/features/cart/cart.svelte';
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { CHECKOUT_CONFIG } from '@/shared/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import ConvexMutationForm from '@/components/ui/mutation-form/convex-mutation-form.svelte';
	import CheckoutSummary from './checkout-summary/checkout-summary.svelte';
	import CheckoutFulfillmentSelect from './checkout-fulfillment-select.svelte';

	// SCHEMAS
	import {
		placeOrderFormSchema,
		type PlaceOrderFormInput
	} from '@/shared/features/orders/schemas/ordersSchemas';

	// FORMS
	import { createPlaceOrderForm } from '@/features/orders/forms/placeOrderForm';

	// UTILS
	import { toastResult } from '@/utils/toastResult';
	import { appGoto } from '@/utils/app-navigation.js';
	import { toPlaceOrderArgs } from '@/features/orders/utils/ordersUtils.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';

	const auth = useAuth();

	// Stable idempotency key for this checkout attempt (retries reuse it → one order). Must be
	// globally unique — the server dedupes orders by it — so a UUID, never a per-instance DOM id.
	const attemptId = crypto.randomUUID();

	const canPickup = CHECKOUT_CONFIG.FULFILLMENT.PICKUP;
	const canDeliver = CHECKOUT_CONFIG.FULFILLMENT.DELIVERY !== null;
	const modeOptions = [
		...(canPickup ? [{ value: 'pickup', label: 'Recoger en tienda' }] : []),
		...(canDeliver ? [{ value: 'delivery', label: 'Entrega a domicilio' }] : [])
	];

	// Prefill source, read once at init. The two cover each other's blind spot: `authClass` is live
	// but still empty this early on a hard load, while `page.data` is the SSR snapshot and doesn't
	// refresh on client-side navigation (so it's stale after an in-app sign-in).
	const user = authClass.currentUser ?? page.data.currentUser;

	// Prefilled from the signed-in user, editable by guests.
	let values = $state<PlaceOrderFormInput>({
		name: user?.name ?? '',
		email: user?.email ?? '',
		phone: '',
		mode: canPickup ? 'pickup' : 'delivery',
		line1: '',
		line2: '',
		city: '',
		postcode: '',
		country: '',
		note: ''
	});

	const sections = $derived(
		createPlaceOrderForm({ modeOptions, showAddress: values.mode === 'delivery' })
	);

	// Refs the server rejected on the last attempt — the summary greys them out.
	let unavailableRefs = $state<string[]>([]);

	type PlaceOrderResult = FunctionReturnType<
		typeof api.tables.orders.mutations.placeOrder.placeOrder
	>;

	/** Placement navigates instead of staying put, so the result is handled here rather than by the
	 *  form's default handling. */
	async function handleResult(result: unknown) {
		const res = result as PlaceOrderResult;

		// Soft failures (checkout disabled, unavailable lines) toast their backend message and mark
		// the offending lines in the summary.
		if (!toastResult(res) || !res.data?.orderId) {
			unavailableRefs = res.data?.unavailableRefs ?? [];
			return false;
		}

		// Hosted payment provider (Stripe, later) → follow the redirect. Manual → success page.
		if (res.data.payment?.kind === 'redirect') {
			window.location.href = res.data.payment.url;
			return true;
		}

		cart.clear();
		// Guests have no session to look the order up with, so the success page needs their email.
		const email = auth.isAuthenticated ? '' : `&email=${encodeURIComponent(values.email)}`;
		await appGoto(`${UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT_SUCCESS}?order=${res.data.orderId}${email}`);
		return true;
	}
</script>

<ConvexMutationForm
	bind:values
	{sections}
	schema={placeOrderFormSchema}
	runFunction={api.tables.orders.mutations.placeOrder.placeOrder}
	transformArgs={(_args, v) =>
		toPlaceOrderArgs(
			v,
			attemptId,
			cart.lines.map((l) => ({ productRef: l.productRef, qty: l.qty }))
		)}
	onResult={handleResult}
	resetOnSuccess={false}
	customFields={{ mode: modeField }}
	class="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8"
	{actions}
/>

<!-- Rich card picker for the fulfillment method, in place of the default radio group. -->
{#snippet modeField({
	field,
	value,
	setValue
}: {
	field: { id: string; options?: { value: string; label: string; disabled?: boolean }[] };
	value: unknown;
	setValue: (next: unknown) => void;
})}
	<CheckoutFulfillmentSelect
		options={field.options ?? []}
		selected={value as string}
		name={field.id}
		onselect={setValue}
	/>
{/snippet}

<!-- The summary carries the submit button, so it is the form's `actions` rather than a sibling. -->
{#snippet actions({ busy }: { busy: boolean })}
	<aside class="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
		<CheckoutSummary mode={values.mode} {unavailableRefs} {busy} />
	</aside>
{/snippet}
