<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import type { CalendarDate } from '@internationalized/date';
	import { useAuth, useMutation, useQuery } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';
	import { api } from '@/convex/_generated/api';

	// CLASSES
	import { cart } from '@/features/cart/cart.svelte';
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import Form from '@/components/ui/custom-components/form/form.svelte';
	import CalendarWithTime from '@/components/ui/custom-components/calendar-with-time/calendar-with-time.svelte';
	import { FieldError } from '@/components/ui/field/index.js';
	import CheckoutSummary from './checkout-summary/checkout-summary.svelte';

	// SCHEMAS
	import {
		placeOrderFormSchema,
		type PlaceOrderFormInput
	} from '@/shared/features/orders/schemas/ordersSchemas';

	// FORMS
	import { createPlaceOrderForm } from '@/features/orders/forms/placeOrderForm';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
	import { zodIssuesToFieldErrors } from '@/shared/features/validations/utils/zodFieldErrors.js';
	import { hasErrorMessage } from '@/shared/utils/errorMessage';
	import { appGoto } from '@/utils/app-navigation.js';
	import { toPlaceOrderArgs } from '@/features/orders/utils/ordersUtils.js';
	import {
		readOrCreateAttemptId,
		clearAttemptId
	} from '@/features/orders/utils/checkoutAttempt.js';

	// TYPES
	import type { FunctionReturnType } from 'convex/server';

	const auth = useAuth();
	const placeOrder = useMutation(api.tables.orders.mutations.placeOrder.placeOrder);

	// The idempotency key is read fresh at every submit and PERSISTS across mounts/tabs
	// (`StripeSystemDesign.md` §5.3): while the order is pending, resubmitting updates that same
	// draft instead of creating a sibling — one live order per browser, no orphan pending rows,
	// no superseded payment session. Cleared on the success page.
	const placeOrderArgs = () =>
		toPlaceOrderArgs(
			values,
			readOrCreateAttemptId(),
			cart.lines.map((l) => ({ productRef: l.productRef, qty: l.qty })),
			{ pickupDate: pickupDate?.toString() ?? '', pickupTime: pickupTime ?? '' }
		);

	const defaultPayment = 'online';

	// Prefill source, read once at init. The two cover each other's blind spot: `authClass` is live
	// but still empty this early on a hard load, while `page.data` is the SSR snapshot and doesn't
	// refresh on client-side navigation (so it's stale after an in-app sign-in).
	const user = authClass.currentUser ?? page.data.currentUser;

	// Prefilled from the signed-in user, editable by guests.
	let values = $state<PlaceOrderFormInput>({
		name: user?.name ?? '',
		email: user?.email ?? '',
		phone: '',
		payment: defaultPayment,
		pickupDate: '',
		pickupTime: '',
		note: ''
	});

	let pickupDate = $state<CalendarDate | undefined>();
	let pickupTime = $state<string | null>(null);
	let availabilityMessage = $state('');

	const availabilityQuery = useQuery(
		api.tables.availability.queries.fetchAvailability.fetchBlockedPickupTimes,
		() => (pickupDate ? { date: pickupDate.toString() } : 'skip')
	);
	const pickupDateKey = $derived(pickupDate?.toString() ?? null);
	const availability = $derived(
		availabilityQuery.data?.date === pickupDateKey ? availabilityQuery.data : null
	);
	const blockedTimes = $derived(availability?.blockedTimes ?? []);
	const availabilityLoading = $derived(
		pickupDateKey !== null && !availabilityQuery.error && availability === null
	);
	const availabilityError = $derived(pickupDateKey !== null && Boolean(availabilityQuery.error));

	$effect(() => {
		if (!pickupTime) return;
		if (blockedTimes.includes(pickupTime)) {
			pickupTime = null;
			availabilityMessage = 'Ese horario ya no está disponible. Elige otro.';
			return;
		}
		availabilityMessage = '';
	});

	function validateCheckout(input: Record<string, unknown>): Partial<Record<string, string>> {
		const validation = placeOrderFormSchema.safeParse({
			...input,
			pickupDate: pickupDate?.toString() ?? '',
			pickupTime: pickupTime ?? ''
		});
		const errors = validation.success ? {} : zodIssuesToFieldErrors(validation.error.issues);
		if (availabilityLoading) {
			errors.pickupTime = 'Espera mientras consultamos los horarios disponibles.';
		}
		if (availabilityError) {
			errors.pickupTime = 'No pudimos consultar los horarios. Inténtalo de nuevo.';
		}
		return errors;
	}

	const sections = $derived(createPlaceOrderForm());

	// Refs the server rejected on the last attempt — the summary greys them out.
	let unavailableRefs = $state<string[]>([]);

	type PlaceOrderResult = FunctionReturnType<
		typeof api.tables.orders.mutations.placeOrder.placeOrder
	>;

	/** Placement navigates instead of staying put, so the result is handled here rather than by the
	 *  form's default handling. */
	async function handleResult(result: unknown, allowRetry = true): Promise<void> {
		const res = result as PlaceOrderResult;

		// The stored attempt id points at a draft owned by somebody else (shared computer, or a
		// draft started under a different session). Self-heal silently — forget it, mint a new one,
		// place once more — so the shopper never sees this as an error.
		if (
			allowRetry &&
			!res.success &&
			res.message === 'Iniciamos un pedido nuevo. Inténtalo de nuevo.'
		) {
			clearAttemptId();
			let retried: PlaceOrderResult;
			try {
				retried = await placeOrder(placeOrderArgs());
			} catch (error) {
				if (error instanceof ConvexError && hasErrorMessage(error.data)) {
					toastMessage({
						type: 'error',
						error,
						message: error.data.message
					});
				} else if (isRateLimitError(error)) {
					toastMessage({ type: 'error', error, message: '' });
				} else {
					throw error;
				}
				return;
			}
			return handleResult(retried, false);
		}

		// Soft failures (checkout disabled, unavailable lines) toast their backend message and mark
		// the offending lines in the summary.
		//
		// Deliberately no success toast: every success path here navigates away immediately — so
		// "Pedido realizado" would only flash for a frame on the way to Stripe or the confirmation
		// page. The destination states it properly.
		if (!res.success || !res.data?.orderId) {
			if (!res.success) {
				toastMessage({ type: 'error', error: null, message: res.message });
			}
			unavailableRefs = res.data?.unavailableRefs ?? [];
			return;
		}

		// Online payment → our pay page, which mints the Stripe session and redirects on.
		if (res.data.payment?.kind === 'redirect') {
			window.location.href = res.data.payment.url;
			return;
		}

		cart.clear();
		// Guests have no session to look the order up with, so the success page needs their email.
		const email = auth.isAuthenticated ? '' : `&email=${encodeURIComponent(values.email)}`;
		await appGoto(
			`${UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT_SUCCESS}?order=${res.data.orderId}${email}`
		);
		return;
	}

	let submitting = $state(false);
</script>

<div class="lg:grid lg:grid-cols-[1fr_380px] lg:items-start lg:gap-8">
	<Form
		id="checkout-form"
		bind:values
		fields={sections}
		function={api.tables.orders.mutations.placeOrder.placeOrder}
		prepareArgs={() => placeOrderArgs()}
		validate={validateCheckout}
		validationErrorMessage="Hay errores en los campos. Revísalos antes de continuar."
		novalidate
		onSuccess={(result) => handleResult(result)}
		resetOnSuccess={false}
		bind:submitting
		class="lg:col-start-1 lg:row-start-1"
	>
		{#snippet renderCustomField(field, fieldErrors)}
			{#if field.name === 'pickupSchedule'}
				<div class="space-y-3">
					<div class="space-y-1">
						<p class="text-sm font-medium">¿Qué día quieres recoger tu pedido?</p>
						<p class="text-sm text-muted-foreground">¿A qué hora te queda bien?</p>
					</div>
					<div
						class={fieldErrors.pickupDate || fieldErrors.pickupTime
							? 'rounded-lg border border-destructive ring-3 ring-destructive/20'
							: 'rounded-lg'}
						data-validation-target="true"
						tabindex="-1"
					>
						<CalendarWithTime
							bind:value={pickupDate}
							bind:selectedTime={pickupTime}
							{blockedTimes}
							{availabilityLoading}
							{availabilityError}
						/>
					</div>
					{#if availabilityMessage}
						<p class="text-sm text-destructive" role="status" aria-live="polite">
							{availabilityMessage}
						</p>
					{/if}
					<input
						class="sr-only"
						name="pickupDate"
						aria-label="Fecha de recogida"
						aria-invalid={fieldErrors.pickupDate ? 'true' : undefined}
						aria-describedby={fieldErrors.pickupDate || fieldErrors.pickupTime
							? 'checkout-pickup-schedule-error'
							: undefined}
						value={pickupDate?.toString() ?? ''}
						required
					/>
					<input
						class="sr-only"
						name="pickupTime"
						aria-label="Hora de recogida"
						aria-invalid={fieldErrors.pickupTime ? 'true' : undefined}
						aria-describedby={fieldErrors.pickupDate || fieldErrors.pickupTime
							? 'checkout-pickup-schedule-error'
							: undefined}
						value={pickupTime ?? ''}
						required
					/>
					{#if fieldErrors.pickupDate || fieldErrors.pickupTime}
						<FieldError id="checkout-pickup-schedule-error">
							{fieldErrors.pickupDate ?? ''}
							{#if fieldErrors.pickupDate && fieldErrors.pickupTime}<br />{/if}
							{fieldErrors.pickupTime ?? ''}
						</FieldError>
					{/if}
				</div>
			{/if}
		{/snippet}
	</Form>

	<aside class="mt-6 lg:sticky lg:top-6 lg:col-start-2 lg:row-start-1 lg:mt-0">
		<CheckoutSummary {unavailableRefs} busy={submitting} formId="checkout-form" />
	</aside>
</div>
