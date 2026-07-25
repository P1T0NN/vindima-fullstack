<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { useConvexClient } from '@mmailaender/convex-svelte';
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
	import { CardSelect } from '@/components/ui/card-select/index.js';

	// LUCIDE ICONS
	import StoreIcon from '@lucide/svelte/icons/store';
	import TruckIcon from '@lucide/svelte/icons/truck';
	import BanknoteIcon from '@lucide/svelte/icons/banknote';
	import CreditCardIcon from '@lucide/svelte/icons/credit-card';

	// SCHEMAS
	import {
		placeOrderFormSchema,
		type PlaceOrderFormInput
	} from '@/shared/features/orders/schemas/ordersSchemas';

	// FORMS
	import { createPlaceOrderForm } from '@/features/orders/forms/placeOrderForm';

	// UTILS
	import { toastError } from '@/utils/toastResult';
	import { appGoto } from '@/utils/app-navigation.js';
	import { safeMutation } from '@/utils/convexHelpers';
	import { toPlaceOrderArgs } from '@/features/orders/utils/ordersUtils.js';
	import {
		readOrCreateAttemptId,
		clearAttemptId
	} from '@/features/orders/utils/checkoutAttempt.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';

	const auth = useAuth();
	const convex = useConvexClient();

	// The idempotency key is read fresh at every submit and PERSISTS across mounts/tabs
	// (`StripeSystemDesign.md` §5.3): while the order is pending, resubmitting updates that same
	// draft instead of creating a sibling — one live order per browser, no orphan pending rows,
	// no superseded payment session. Cleared on the success page.
	const placeOrderArgs = () =>
		toPlaceOrderArgs(
			values,
			readOrCreateAttemptId(),
			cart.lines.map((l) => ({ productRef: l.productRef, qty: l.qty }))
		);

	const canPickup = CHECKOUT_CONFIG.FULFILLMENT.PICKUP;
	const canDeliver = CHECKOUT_CONFIG.FULFILLMENT.DELIVERY !== null;
	const modeOptions = [
		...(canPickup ? [{ value: 'pickup', label: 'Recoger en tienda' }] : []),
		...(canDeliver ? [{ value: 'delivery', label: 'Entrega a domicilio' }] : [])
	];

	// Payment methods: cash shows only when enabled; online always renders so the shopper sees the
	// choice, greyed out ("Próximamente") when a store runs cash-only (PAYMENT_METHODS.ONLINE).
	const canCash = CHECKOUT_CONFIG.PAYMENT_METHODS.CASH;
	const canOnline = CHECKOUT_CONFIG.PAYMENT_METHODS.ONLINE;
	const paymentOptions = [
		...(canCash ? [{ value: 'cash', label: 'Efectivo' }] : []),
		{ value: 'online', label: 'Pago en línea', disabled: !canOnline }
	];
	const defaultPayment = canCash ? 'cash' : canOnline ? 'online' : 'cash';

	// Icon + blurb per card value, for the rich card pickers (fulfillment + payment).
	const fulfillmentMeta = {
		pickup: {
			icon: StoreIcon,
			description: 'Recoge tu pedido en tienda cuando esté listo. Sin costo de envío.'
		},
		delivery: { icon: TruckIcon, description: 'Entregamos en la dirección que indiques abajo.' }
	};
	const paymentMeta = {
		cash: {
			icon: BanknoteIcon,
			description: 'Paga al recoger o en la entrega. Sin pago en línea.'
		},
		online: { icon: CreditCardIcon, description: 'Paga con tarjeta en una página segura.' }
	};

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
		payment: defaultPayment,
		line1: '',
		line2: '',
		city: '',
		postcode: '',
		country: '',
		note: ''
	});

	const sections = $derived(
		createPlaceOrderForm({ modeOptions, paymentOptions, showAddress: values.mode === 'delivery' })
	);

	// Refs the server rejected on the last attempt — the summary greys them out.
	let unavailableRefs = $state<string[]>([]);

	type PlaceOrderResult = FunctionReturnType<
		typeof api.tables.orders.mutations.placeOrder.placeOrder
	>;

	/** Placement navigates instead of staying put, so the result is handled here rather than by the
	 *  form's default handling. */
	async function handleResult(result: unknown, allowRetry = true): Promise<boolean> {
		const res = result as PlaceOrderResult;

		// The stored attempt id points at a draft owned by somebody else (shared computer, or a
		// draft started under a different session). Self-heal silently — forget it, mint a new one,
		// place once more — so the shopper never sees this as an error.
		if (allowRetry && !res.success && res.message?.key === 'CheckoutMessages.ATTEMPT_CONFLICT') {
			clearAttemptId();
			const retried = await safeMutation(
				convex,
				api.tables.orders.mutations.placeOrder.placeOrder,
				placeOrderArgs()
			);
			if (!retried) return false;
			return await handleResult(retried, false);
		}

		// Soft failures (checkout disabled, unavailable lines) toast their backend message and mark
		// the offending lines in the summary.
		//
		// Deliberately NOT `toastResult`: that also toasts the SUCCESS message, and every success
		// path here navigates away immediately — so "Pedido realizado" only ever flashed for a
		// frame on the way to Stripe or the confirmation page. The destination states it properly.
		if (!res.success || !res.data?.orderId) {
			toastError(res);
			unavailableRefs = res.data?.unavailableRefs ?? [];
			return false;
		}

		// Online payment → our pay page, which mints the Stripe session and redirects on. Cash →
		// straight to the confirmation page.
		if (res.data.payment?.kind === 'redirect') {
			window.location.href = res.data.payment.url;
			return true;
		}

		cart.clear();
		// Guests have no session to look the order up with, so the success page needs their email.
		const email = auth.isAuthenticated ? '' : `&email=${encodeURIComponent(values.email)}`;
		await appGoto(
			`${UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT_SUCCESS}?order=${res.data.orderId}${email}`
		);
		return true;
	}
</script>

<ConvexMutationForm
	bind:values
	{sections}
	schema={placeOrderFormSchema}
	runFunction={api.tables.orders.mutations.placeOrder.placeOrder}
	transformArgs={() => placeOrderArgs()}
	onResult={(result) => handleResult(result)}
	resetOnSuccess={false}
	customFields={{ mode: modeField, payment: paymentField }}
	class="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8"
	{actions}
/>

{#snippet cardField(
	{
		field,
		value,
		setValue
	}: {
		field: { id: string; options?: { value: string; label: string; disabled?: boolean }[] };
		value: unknown;
		setValue: (next: unknown) => void;
	},
	meta: Record<string, { icon?: typeof StoreIcon; description?: string }>
)}
	<CardSelect
		options={field.options ?? []}
		selected={value as string}
		name={field.id}
		{meta}
		onselect={setValue}
	/>
{/snippet}

<!-- Rich card pickers, in place of the default radio groups. -->
{#snippet modeField(props: Parameters<typeof cardField>[0])}
	{@render cardField(props, fulfillmentMeta)}
{/snippet}
{#snippet paymentField(props: Parameters<typeof cardField>[0])}
	{@render cardField(props, paymentMeta)}
{/snippet}

<!-- The summary carries the submit button, so it is the form's `actions` rather than a sibling. -->
{#snippet actions({ busy }: { busy: boolean })}
	<aside class="lg:sticky lg:top-6 lg:col-start-2 lg:row-span-2 lg:row-start-1">
		<CheckoutSummary mode={values.mode} payment={values.payment} {unavailableRefs} {busy} />
	</aside>
{/snippet}
