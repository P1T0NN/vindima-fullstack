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
		header,
		headerBrandClass,
		isNavActive,
		navItems,
		navLinkActiveClass,
		navLinkClass,
		navLinkCompactClass,
		resolveHeaderCta,
		scrollSpy
	} from './header.svelte.ts';

	// COMPONENTS
	import Link from '@/components/ui/link/link.svelte';
	import { Drawer, DrawerClose, DrawerContent, DrawerTrigger } from '@/components/ui/drawer';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { ClassValue } from 'clsx';

	// LUCIDE ICONS
	import MenuIcon from '@lucide/svelte/icons/menu';
	import XIcon from '@lucide/svelte/icons/x';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';
	import LayoutDashboardIcon from '@lucide/svelte/icons/layout-dashboard';
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';

	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	const pathnameLogical = $derived(page.url.pathname);

	const accountHref = $derived(
		isAuthenticated ? PROTECTED_PAGE_ENDPOINTS.ACCOUNT : UNPROTECTED_PAGE_ENDPOINTS.LOGIN
	);
	const accountLabel = $derived(isAuthenticated ? 'My account' : 'Sign in');

	// Gold CTA: Join the Club (signed out) · Admin Dashboard (admin) · My Rewards (member).
	const cta = $derived(resolveHeaderCta(authClass.currentUser, isAuthenticated));
</script>

<Drawer bind:open={header.menuOpen} direction="right" shouldScaleBackground={false}>
	<DrawerTrigger>
		{#snippet child({ props })}
			<button
				{...props}
				type="button"
				class={cn(
					'inline-flex size-9 touch-manipulation items-center justify-center rounded-sm text-accent transition-opacity hover:opacity-80 lg:hidden',
					props.class as ClassValue
				)}
				aria-label={header.menuOpen ? 'Close menu' : 'Open menu'}
			>
				{#if header.menuOpen}
					<XIcon class="size-5" strokeWidth={1.4} />
				{:else}
					<MenuIcon class="size-5" strokeWidth={1.4} />
				{/if}
			</button>
		{/snippet}
	</DrawerTrigger>

	<DrawerContent
		id="site-mobile-nav"
		aria-describedby={undefined}
		class="flex h-full max-h-dvh w-full max-w-80 flex-col gap-5 overflow-x-hidden overflow-y-auto border-border bg-background p-5 shadow-lg! data-[vaul-drawer-direction=right]:w-full sm:max-w-80"
	>
		<div class="flex min-w-0 items-center justify-between gap-2">
			<Link
				href={UNPROTECTED_PAGE_ENDPOINTS.ROOT}
				class={headerBrandClass}
				onclick={header.closeMenu}
			>
				<span class="size-[7px] shrink-0 rounded-full bg-primary" aria-hidden="true"></span>
				{COMPANY_DATA.NAME}
			</Link>

			<DrawerClose>
				<button
					type="button"
					class="inline-flex size-9 shrink-0 touch-manipulation items-center justify-center rounded-sm text-accent hover:opacity-80"
					aria-label="Close menu"
				>
					<XIcon class="size-5" strokeWidth={1.4} />
				</button>
			</DrawerClose>
		</div>

		<nav aria-label="Mobile main">
			<ul class="flex flex-col gap-1">
				{#each navItems as item, i (item.href)}
					{@const active = isNavActive(pathnameLogical, scrollSpy.active, item.href)}

					<li>
						<Link
							id={i === 0 ? 'site-mobile-nav-first' : undefined}
							href={item.href}
							class={cn(navLinkClass, 'block w-full px-1', active && navLinkActiveClass)}
							aria-current={active ? 'page' : undefined}
							onclick={header.closeMenu}
						>
							{item.label}
						</Link>
					</li>
				{/each}
			</ul>
		</nav>

		<div class="mt-auto flex flex-col gap-4">
			<Link href={accountHref} class={cn(navLinkCompactClass, 'px-1')} onclick={header.closeMenu}>
				{accountLabel}
			</Link>

			<Link href={cta.href} class={cn(btnGoldClass, 'gap-2')} onclick={header.closeMenu}>
				{#if cta.variant === 'admin'}
					<LayoutDashboardIcon class="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
				{:else}
					<SparklesIcon class="size-3.5 shrink-0" strokeWidth={1.75} aria-hidden="true" />
				{/if}
				{cta.label}
			</Link>

			<button
				type="button"
				class={cn(navLinkCompactClass, 'inline-flex items-center gap-2 px-1 text-left')}
				onclick={() => {
					header.closeMenu();
					cart.open();
				}}
			>
				<ShoppingBagIcon class="size-4 shrink-0" strokeWidth={1.4} />
				Cart
				{#if cart.count > 0}
					<span
						class="flex h-4 min-w-4 items-center justify-center rounded-[9px] bg-accent px-[3px] text-xs leading-4 font-semibold text-primary tabular-nums"
						aria-hidden="true"
					>
						{cart.count > 99 ? '99+' : cart.count}
					</span>
				{/if}
			</button>

			{#if isAuthenticated}
				<LogoutButton onClick={header.closeMenu} />
			{/if}
		</div>
	</DrawerContent>
</Drawer>
