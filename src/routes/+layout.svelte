<script lang="ts">
	import './layout.css';

	// SVELTEKIT IMPORTS
	import { dev } from '$app/environment';
	import { page } from '$app/state';

	// LIBRARIES
	import { createSvelteAuthClient } from '@mmailaender/convex-better-auth-svelte/svelte';
	import { authClient } from '@/features/auth/lib/auth-client';
	import { useQuery, useConvexClient } from '@mmailaender/convex-svelte';
	import { api } from '@/convex/_generated/api';
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// CLASSES
	import { authClass, type CurrentUser } from '@/features/auth/classes/authClass.svelte';
	import { cart } from '@/features/cart/cart.svelte';

	// COMPONENTS
	import { Toaster } from '@/components/ui/sonner';
	import Header from '@/components/ui/header/header.svelte';
	import Footer from '@/components/ui/footer/footer.svelte';
	import CartSidebar from '@/components/ui/cart/cart-sidebar.svelte';
	import AuthErrorBanner from '@/features/auth/components/auth-error-banner/auth-error-banner.svelte';

	// TYPES
	import type { CartLine } from '@/shared/features/cart/cartUtils';

	let { children, data } = $props();

	// Admin has its own shell (sidebar + site header) — hide the storefront chrome there.
	const isAdminRoute = $derived(page.url.pathname.startsWith('/admin'));

	createSvelteAuthClient({
		authClient,
		getServerState: () => data.authState
	});

	// NOTE: Has to be after the `createSvelteAuthClient` call because it uses the `authClient` instance.
	const auth = useAuth();

	const currentUserResponse = useQuery(
		api.auth.queries.authQueries.getCurrentUser,
		() => (auth.isAuthenticated ? {} : 'skip'),
		() => ({
			initialData: data.currentUser ?? undefined,
			keepPreviousData: true
		})
	);

	// Push the live query into the shared store so any component can read
	// `authClass.currentUser` without re-subscribing.
	$effect(() => {
		// Definitively signed out (not loading) — otherwise a skipped query would leave the
		// store at `undefined` ("not yet synced") and consumers could wait forever.
		if (!auth.isAuthenticated) {
			authClass.syncFromCurrentUserQuery(null, false);
			return;
		}
		const user = currentUserResponse.data as CurrentUser | null | undefined;
		authClass.syncFromCurrentUserQuery(user, currentUserResponse.isLoading);
	});

	// CART — one subscription drives the authenticated cart; guests use localStorage.
	const convex = useConvexClient();
	const cartResponse = useQuery(api.tables.cart.queries.getMyCart.getMyCart, () =>
		auth.isAuthenticated ? {} : 'skip'
	);

	// Tell the cart the current auth state + client (handles guest→server merge on login).
	$effect(() => {
		cart.setAuth(!!auth.isAuthenticated, convex);
	});
	// Mirror the live server cart into `CartState` (reconciles optimistic writes).
	$effect(() => {
		cart.loading = !!auth.isAuthenticated && cartResponse.isLoading;
		cart.syncFromServer(cartResponse.data as CartLine[] | null | undefined);
	});
</script>

<svelte:head>
	<link rel="icon" href="/favicon.ico" sizes="any" />
	<link rel="preconnect" href="https://fonts.googleapis.com" />
	<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous" />
	<link
		href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600&family=Jost:wght@400;500;600&display=swap"
		rel="stylesheet"
	/>
	{#if !dev}
		<script
			defer
			src="https://umami-sable-iota.vercel.app/script.js"
			data-website-id="b8f657d5-dddc-4c34-bdda-2da1cf55e58f"
		></script>
	{/if}
</svelte:head>

<div class="flex min-h-dvh flex-col">
	{#if !isAdminRoute}
		<Header />
	{/if}
	<div class="min-h-0 flex-1">
		{@render children()}
	</div>
	{#if !isAdminRoute}
		<Footer />
	{/if}
</div>
<CartSidebar />
<Toaster richColors />
<AuthErrorBanner />
