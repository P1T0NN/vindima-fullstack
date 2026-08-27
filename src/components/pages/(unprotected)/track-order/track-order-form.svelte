<script lang="ts">
	// LIBRARIES
	import { useConvexClient } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Field, FieldContent, FieldError, FieldLabel } from '@/components/ui/field/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// SCHEMAS
	import { trackOrderFormSchema } from '@/shared/features/orders/schemas/ordersSchemas.js';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';
	import { zodIssuesToFieldErrors } from '@/shared/features/validations/utils/zodFieldErrors.js';
	import { toastMessage } from '@/utils/toastMessage.js';

	// TYPES
	import type { TrackOrderFormInput } from '@/shared/features/orders/schemas/ordersSchemas.js';

	const id = $props.id();
	const convex = useConvexClient();

	type FieldName = keyof TrackOrderFormInput;

	let values = $state<TrackOrderFormInput>({ number: '', email: '' });
	let fieldErrors = $state<Partial<Record<FieldName, string>>>({});
	let notFound = $state(false);
	let submitting = $state(false);

	function updateValue(field: FieldName, value: string) {
		values[field] = value;
		if (fieldErrors[field]) {
			const nextErrors = { ...fieldErrors };
			delete nextErrors[field];
			fieldErrors = nextErrors;
		}
	}

	function focusField(field: FieldName) {
		document.getElementById(`track-order-${field}-${id}`)?.focus();
	}

	async function lookup(input: TrackOrderFormInput): Promise<boolean> {
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

	async function handleSubmit(
		event: SubmitEvent & { currentTarget: EventTarget & HTMLFormElement }
	): Promise<void> {
		event.preventDefault();
		if (submitting) return;

		const input = $state.snapshot(values) as TrackOrderFormInput;
		const validation = trackOrderFormSchema.safeParse(input);
		if (!validation.success) {
			fieldErrors = zodIssuesToFieldErrors(validation.error.issues, ['number', 'email']);
			toastMessage({
				type: 'error',
				error: null,
				message: 'Corrige los errores del formulario'
			});

			const firstInvalid = Object.keys(fieldErrors)[0] as FieldName | undefined;
			if (firstInvalid) focusField(firstInvalid);
			return;
		}

		fieldErrors = {};
		submitting = true;
		try {
			await lookup(validation.data);
		} finally {
			submitting = false;
		}
	}
</script>

<form class="mt-9 flex flex-col gap-6" novalidate aria-busy={submitting} onsubmit={handleSubmit}>
	<Field data-disabled={submitting} data-invalid={fieldErrors.number ? 'true' : undefined}>
		<FieldLabel for="track-order-number-{id}">Número de pedido</FieldLabel>
		<FieldContent>
			<Input
				id="track-order-number-{id}"
				name="number"
				placeholder="ORD-8B66KY"
				autocomplete="off"
				required
				disabled={submitting}
				value={values.number}
				class="uppercase"
				aria-invalid={fieldErrors.number ? 'true' : undefined}
				aria-describedby={fieldErrors.number ? `track-order-number-${id}-error` : undefined}
				oninput={(event) => updateValue('number', event.currentTarget.value)}
			/>
			{#if fieldErrors.number}
				<FieldError id="track-order-number-{id}-error">{fieldErrors.number}</FieldError>
			{/if}
		</FieldContent>
	</Field>

	<Field data-disabled={submitting} data-invalid={fieldErrors.email ? 'true' : undefined}>
		<FieldLabel for="track-order-email-{id}">Correo electrónico</FieldLabel>
		<FieldContent>
			<Input
				id="track-order-email-{id}"
				name="email"
				type="email"
				placeholder="tu@correo.com"
				autocomplete="email"
				required
				disabled={submitting}
				aria-invalid={fieldErrors.email ? 'true' : undefined}
				aria-describedby={fieldErrors.email ? `track-order-email-${id}-error` : undefined}
				value={values.email}
				oninput={(event) => updateValue('email', event.currentTarget.value)}
			/>
			{#if fieldErrors.email}
				<FieldError id="track-order-email-{id}-error">{fieldErrors.email}</FieldError>
			{/if}
		</FieldContent>
	</Field>

	{#if notFound}
		<p class="text-sm leading-relaxed text-destructive" role="alert">
			No encontramos un pedido con esos datos. Revisa el número y el correo: deben coincidir con los
			de tu confirmación.
		</p>
	{/if}

	<Button type="submit" disabled={submitting} class="w-full">
		{#if submitting}<Spinner class="size-3.5" />{/if}
		Ver mi pedido
	</Button>
</form>
