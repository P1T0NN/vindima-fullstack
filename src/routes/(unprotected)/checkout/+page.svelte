<script lang="ts">
	// SVELTEKIT
	import { onMount } from 'svelte';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';

	// CONFIG
	import { CHECKOUT_CONFIG, FEATURES } from '@/shared/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import CheckoutHeader from '@/components/pages/(unprotected)/checkout/checkout-header.svelte';
	import CheckoutForm from '@/components/pages/(unprotected)/checkout/checkout-form.svelte';
	import CheckoutPageLoading from '@/components/pages/(unprotected)/checkout/loading/checkout-page-loading.svelte';
	import CheckoutCartEmpty from '@/components/pages/(unprotected)/checkout/empty/checkout-cart-empty.svelte';

	const auth = useAuth();

	// The guest cart hydrates from localStorage on the client only, so it's unknown during SSR and
	// the first paint; `onMount` marks the point where reading it is trustworthy.
	let mounted = $state(false);
	onMount(() => {
		mounted = true;
	});

	// Page-level gates — the form only mounts (and only subscribes) once these pass.
	const checkoutOff = $derived(!FEATURES.CHECKOUT);
	// Hold the empty/blocked/form decision until we actually know the cart and auth state — until
	// then the cart reads as empty, which would wrongly flash the "cart is empty" screen on load.
	const loading = $derived(!mounted || auth.isLoading || cart.loading);
	const guestBlocked = $derived(!auth.isAuthenticated && !CHECKOUT_CONFIG.ALLOW_GUEST_CHECKOUT);
	const cartEmpty = $derived(cart.lines.length === 0);
</script>

<SvelteHead
	title="Finalizar compra"
	noindex
	description="Completa tu pedido de Vindima para recoger en tienda o entrega a domicilio."
/>

<Section
	yPadding="none"
	class="min-h-[calc(100dvh-3.5rem)] bg-background py-8 sm:py-12"
>
	<CheckoutHeader />

	{#if checkoutOff}
		<!-- Checkout switched off in config (`FEATURES.CHECKOUT`) — not a transient failure, so no retry. -->
		<ErrorComponent
			variant="alert"
			title="Pago no disponible"
			description="El pago no está disponible en este momento. Intenta de nuevo más tarde."
			showRetry={false}
		/>
	{:else if loading}
		<CheckoutPageLoading />
	{:else if cartEmpty}
		<CheckoutCartEmpty />
	{:else if guestBlocked}
		<!-- Guest checkout is off — prompt sign-in up front (cart is preserved). Retry wouldn't help. -->
		<ErrorComponent
			variant="alert"
			title="Inicia sesión para continuar"
			description="Inicia sesión para hacer tu pedido — tu carrito está guardado."
			showRetry={false}
		>
			<Button href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}>Iniciar sesión</Button>
		</ErrorComponent>
	{:else}
		<CheckoutForm />
	{/if}
</Section>
