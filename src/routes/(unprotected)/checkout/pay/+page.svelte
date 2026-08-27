<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';
	import { onMount } from 'svelte';

	// LIBRARIES
	import { useAction } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/custom-components/section/section.svelte';
	import StaticImage from '@/components/ui/custom-components/static-image/static-image.svelte';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
	import { hasErrorMessage } from '@/shared/utils/errorMessage';

	// TYPES
	import type { Id } from '@/convex/_generated/dataModel';

	const logoImage = '/logo/opt/logo-640w.webp';

	/**
	 * The single "get me to Stripe" surface (`StripeSystemDesign.md` §7.5). Reached from the
	 * placement redirect, the "Completar pago" email CTA, and any payment resume.
	 *
	 * Idempotent by construction: the action reuses the order's open session, so refreshing this
	 * page, opening it twice, or clicking an old email link all land on ONE Stripe session.
	 */
	const orderId = $derived(page.url.searchParams.get('order') ?? '');
	const email = $derived(page.url.searchParams.get('email') ?? undefined);

	const createSession = useAction(
		api.tables.orders.actions.createCheckoutSession.createCheckoutSession
	);

	let failed = $state(false);
	let errorText = $state('');

	async function goToPayment() {
		failed = false;

		if (!orderId) {
			failed = true;
			errorText = 'No encontramos este pedido.';
			return;
		}

		try {
			let res;
			try {
				res = await createSession({ orderId: orderId as Id<'orders'>, email });
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
				failed = true;
				errorText = 'No pudimos abrir la página de pago. Inténtalo de nuevo.';
				return;
			}

			if (!res || !res.success || !res.data?.url) {
				failed = true;
				errorText = res.message;
				return;
			}

			// `replace`, not `assign`: the back button should return to checkout, not to this
			// transient redirect step.
			window.location.replace(res.data.url);
		} catch (error) {
			console.error('[checkout/pay] could not create the payment session', error);
			failed = true;
			errorText = 'No pudimos abrir la página de pago. Inténtalo de nuevo.';
		}
	}

	// `onMount`, NOT a route loader — a deliberate exception to GeneralSystemDesignRule.md
	// § data-loading: this call has SIDE EFFECTS (it creates a Stripe Checkout Session), and
	// loaders are prefetched on hover intent (`data-sveltekit-preload-data`), which would mint
	// sessions for links nobody clicked. Lifecycle work, Pattern C.
	onMount(goToPayment);
</script>

<SvelteHead title="Redirigiendo al pago" noindex description="Redirigiendo a la página de pago." />

<!-- `fillViewport` + `centerContent` are Section's own centring API: they put the flex on the
     INNER container. Centring classes on the outer <section> only centre that container, which
     is already full-width, so the content stays pinned left. -->
<Section fillViewport centerContent surface="background" yPadding="none">
	{#if failed}
		<div class="flex w-full max-w-sm flex-col items-center gap-5 text-center">
			<span
				class="flex size-11 items-center justify-center rounded-full bg-destructive/10 text-destructive"
			>
				<span class="icon-[lucide--triangle-alert] size-5"></span>
			</span>
			<div class="flex flex-col gap-2">
				<h1 class="font-display text-2xl font-semibold tracking-wide text-accent uppercase">
					No pudimos continuar
				</h1>
				<p class="text-sm leading-relaxed text-muted-foreground">{errorText}</p>
			</div>
			<div class="mt-1 flex flex-wrap items-center justify-center gap-3">
				<Button onclick={goToPayment}>Reintentar</Button>
				<Button variant="outline" href={UNPROTECTED_PAGE_ENDPOINTS.CHECKOUT}>
					Volver al checkout
				</Button>
			</div>
		</div>
	{:else}
		<div class="flex w-full max-w-sm flex-col items-center gap-7 text-center">
			<!-- The logo holds the moment: the shopper is between our page and Stripe's, and
			     seeing who they're paying is the reassurance that matters here. -->
			<StaticImage
				src={logoImage}
				alt={COMPANY_DATA.NAME}
				class="h-20 w-auto max-w-[min(14rem,60vw)] object-contain"
				width="160"
				height="36"
				loading="eager"
				decoding="async"
				draggable="false"
			/>

			<!-- Indeterminate rule: a gold sliver travelling a hairline track. Transform-only, so
			     it never triggers layout, and it simply doesn't run under reduced-motion. -->
			<div
				class="pay-track relative h-px w-40 overflow-hidden bg-accent/15"
				role="progressbar"
				aria-label="Preparando el pago"
			>
				<span class="pay-sliver absolute inset-y-0 left-0 w-1/3 bg-primary"></span>
			</div>

			<p class="text-sm text-muted-foreground">Te llevamos al pago seguro...</p>

			<p
				class="mt-2 inline-flex items-center gap-1.5 text-[0.7rem] font-medium tracking-[0.13em] text-muted-foreground/70 uppercase"
			>
				<span class="icon-[lucide--lock] size-3"></span>
				Pago procesado por Stripe
			</p>
		</div>
	{/if}
</Section>

<style>
	@media (prefers-reduced-motion: no-preference) {
		.pay-sliver {
			animation: pay-sliver 1.15s cubic-bezier(0.65, 0, 0.35, 1) infinite;
		}
	}
	/* Reduced motion: hold a static filled third rather than an empty track. */
	@media (prefers-reduced-motion: reduce) {
		.pay-sliver {
			left: 33%;
		}
	}
	@keyframes pay-sliver {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(400%);
		}
	}
</style>
