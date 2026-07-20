<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';
	import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// CLASSES
	import {
		btnGoldClass,
		headerBrandClass,
		isNavActive,
		navItems,
		navLinkActiveClass,
		navLinkClass,
		navLinkCompactClass,
		resolveHeaderCta,
		scrollSpy,
		startScrollSpy
	} from './header.svelte.ts';

	// COMPONENTS
	import Link from '@/components/ui/link/link.svelte';
	import HeaderMobile from './header-mobile.svelte';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// LUCIDE ICONS
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';

	type Props = {
		class?: string;
		isSticky?: boolean;
	};

	let { class: className, isSticky = true }: Props = $props();

	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	const pathnameLogical = $derived(page.url.pathname);

	const accountHref = $derived(
		isAuthenticated ? PROTECTED_PAGE_ENDPOINTS.ACCOUNT : UNPROTECTED_PAGE_ENDPOINTS.LOGIN
	);
	const accountLabel = $derived(isAuthenticated ? 'My account' : 'Sign in');

	// Gold CTA: Join the Club (signed out) · Admin Dashboard (admin) · My Rewards (member).
	const cta = $derived(resolveHeaderCta(authClass.currentUser, isAuthenticated));

	let headerEl = $state<HTMLElement>();

	// Scrollspy: one IntersectionObserver, re-created per route so it targets the
	// current page's sections. Runs client-only ($effect never runs during SSR).
	$effect(() => {
		pathnameLogical; // dependency — rebuild the observer when the route changes
		return startScrollSpy(headerEl?.offsetHeight ?? 72);
	});
</script>

<header
	bind:this={headerEl}
	class={cn(
		'z-50 w-full max-w-full overflow-x-clip border-b border-border bg-background/93 backdrop-blur-[10px]',
		isSticky ? 'sticky top-0' : 'relative',
		className
	)}
>
	<div
		class={cn(PAGE_CONTAINER, 'grid grid-cols-[auto_1fr_auto] items-center gap-4 py-[15px]')}
	>
		<Link href={UNPROTECTED_PAGE_ENDPOINTS.ROOT} class={headerBrandClass}>
			<span class="size-[7px] shrink-0 rounded-full bg-primary" aria-hidden="true"></span>
			{COMPANY_DATA.NAME}
		</Link>

		<nav class="hidden min-w-0 lg:flex" aria-label="Main">
			<ul class="mx-auto flex max-w-full min-w-0 flex-wrap items-center justify-center gap-[18px]">
				{#each navItems as item (item.href)}
					{@const active = isNavActive(pathnameLogical, scrollSpy.active, item.href)}
					<li class="shrink-0">
						<Link
							href={item.href}
							class={cn(navLinkClass, active && navLinkActiveClass)}
							aria-current={active ? 'page' : undefined}
						>
							{item.label}
						</Link>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="flex items-center justify-end gap-3">
			<Link href={accountHref} class={cn(navLinkCompactClass, 'hidden sm:inline-flex')}>
				{accountLabel}
			</Link>

			<Link href={cta.href} class={cn(btnGoldClass, 'hidden gap-2 md:inline-flex')}>
				{#if cta.variant === 'admin'}
					<LayoutDashboardIcon class="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
				{:else}
					<SparklesIcon class="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
				{/if}
				{cta.label}
			</Link>

			<button
				type="button"
				onclick={() => cart.toggle()}
				class="relative flex rounded-sm text-accent transition-opacity outline-none hover:opacity-80 focus-visible:ring-2 focus-visible:ring-primary/40"
				aria-label={cart.count === 1 ? `Cart, ${cart.count} item` : `Cart, ${cart.count} items`}
			>
				<ShoppingBagIcon class="size-[21px]" strokeWidth={1.4} />
				{#if cart.count > 0}
					<span
						class="absolute -top-[7px] -right-[9px] flex h-4 min-w-4 items-center justify-center rounded-[9px] bg-accent px-[3px] text-center text-xs leading-4 font-semibold text-primary tabular-nums"
						aria-hidden="true"
					>
						{cart.count > 99 ? '99+' : cart.count}
					</span>
				{/if}
			</button>

			<HeaderMobile />
		</div>
	</div>
</header>
