<script lang="ts">
	// LIBRARIES
	import { useConvexClient } from '@mmailaender/convex-svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';
	import { normalizeOrderNumber } from '@/shared/features/orders/utils/orderNumber.js';

	/**
	 * Guest order lookup. A guest has no identity we can list orders against, so this page
	 * promises exactly one order and asks for the two things that together prove possession:
	 * the number printed on their confirmation, and the email it was sent to.
	 *
	 * On a hit it hands off to the existing order view rather than rendering a second one.
	 */
	const convex = useConvexClient();

	let orderNumber = $state('');
	let email = $state('');
	let busy = $state(false);
	let notFound = $state(false);

	/** Client-side gate, so an unparseable number never becomes a round trip. */
	const canSubmit = $derived(normalizeOrderNumber(orderNumber) !== '' && email.trim().length > 3);

	async function lookup(event: SubmitEvent) {
		event.preventDefault();
		if (busy || !canSubmit) return;

		busy = true;
		notFound = false;
		try {
			const order = await convex.query(
				api.tables.orders.queries.fetchOrderByNumber.fetchOrderByNumber,
				{ number: orderNumber, email }
			);

			if (!order) {
				notFound = true;
				return;
			}

			await appGoto(
				`${UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT_SUCCESS}?order=${order.id}&email=${encodeURIComponent(email.trim())}`
			);
		} catch (error) {
			console.error('[rastrear-pedido] lookup failed', error);
			notFound = true;
		} finally {
			busy = false;
		}
	}
</script>

<SvelteHead
	title="Rastrear pedido"
	noindex
	description="Consulta el estado de tu pedido de Vindima con tu número de pedido y tu correo."
/>

<Section surface="background" yPadding="xl" class="min-h-[calc(100dvh-3.5rem)]">
	<div class="mx-auto w-full max-w-md">
		<p class="text-[0.7rem] font-semibold tracking-[0.2em] text-primary uppercase">Tu pedido</p>
		<h1
			class="mt-4 font-display text-[2.5rem] leading-[1.05] font-semibold tracking-wide text-accent"
		>
			Rastrear pedido
		</h1>
		<p class="mt-4 text-sm leading-relaxed text-muted-foreground">
			Escribe el número de pedido de tu confirmación y el correo con el que lo hiciste.
		</p>

		<form class="mt-9 flex flex-col gap-5" onsubmit={lookup}>
			<div class="flex flex-col gap-2">
				<Label for="order-number">Número de pedido</Label>
				<Input
					id="order-number"
					bind:value={orderNumber}
					placeholder="ORD-8B66KY"
					autocomplete="off"
					spellcheck={false}
					class="uppercase"
				/>
			</div>

			<div class="flex flex-col gap-2">
				<Label for="order-email">Correo electrónico</Label>
				<Input
					id="order-email"
					type="email"
					bind:value={email}
					placeholder="tu@correo.com"
					autocomplete="email"
				/>
			</div>

			{#if notFound}
				<p class="text-sm leading-relaxed text-destructive" role="alert">
					No encontramos un pedido con esos datos. Revisa el número y el correo — deben coincidir
					con los de tu confirmación.
				</p>
			{/if}

			<Button type="submit" disabled={!canSubmit || busy} class="mt-1 justify-center">
				{#if busy}
					<Spinner class="size-3.5" />
				{/if}
				Ver mi pedido
			</Button>
		</form>

		<p class="mt-10 border-t border-accent/10 pt-6 text-xs leading-relaxed text-muted-foreground">
			¿Tienes cuenta? <a
				href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}
				class="text-accent underline underline-offset-4">Inicia sesión</a
			> y verás todos tus pedidos en un solo lugar.
		</p>
	</div>
</Section>
