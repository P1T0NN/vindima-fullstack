<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// CONFIG
	import { PROTECTED_PAGE_ENDPOINTS, UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// CLASSES
	import {
		btnGoldClass,
		header,
		isNavActive,
		navItems,
		navLinkClass,
		navLinkMobileActiveClass,
		navLinkCompactClass,
		resolveHeaderCta,
		scrollSpy
	} from './header.svelte.ts';

	// COMPONENTS
	import Link from '@/components/ui/link/link.svelte';
	import Logo from '@/components/ui/logo/logo.svelte';
	import { NativeSheet } from '@/components/ui/native-sheet/index.js';
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
	const accountLabel = $derived(isAuthenticated ? 'Mi cuenta' : 'Iniciar sesión');

	// Gold CTA: Join the Club (signed out) · Admin Dashboard (admin) · My Rewards (member).
	const cta = $derived(resolveHeaderCta(authClass.currentUser, isAuthenticated));
</script>

<NativeSheet
	bind:open={header.menuOpen}
	side="right"
	title="Menú"
	showCloseButton={false}
	class="flex h-full max-h-dvh w-full max-w-80 flex-col gap-5 overflow-x-hidden overflow-y-auto border-border bg-background p-5"
>
	{#snippet trigger({ props })}
		<button
			{...props}
			type="button"
			class={cn(
				// `xl:hidden` mirrors the desktop rail's `xl:flex` in header.svelte — the two
				// breakpoints must move together or the nav vanishes between them.
				'inline-flex size-11 touch-manipulation items-center justify-center rounded-sm text-accent transition-opacity hover:opacity-80 xl:hidden',
				props.class as ClassValue
			)}
			aria-label={header.menuOpen ? 'Cerrar menú' : 'Abrir menú'}
		>
			{#if header.menuOpen}
				<XIcon class="size-5" strokeWidth={1.4} />
			{:else}
				<MenuIcon class="size-5" strokeWidth={1.4} />
			{/if}
		</button>
	{/snippet}

	{#snippet children({ close })}
		<div class="flex min-w-0 items-center justify-between gap-2">
			<Logo class="transition-opacity hover:opacity-90" onclick={header.closeMenu} />

			<button
				type="button"
				onclick={close}
				class="inline-flex size-11 shrink-0 touch-manipulation items-center justify-center rounded-sm text-accent hover:opacity-80"
				aria-label="Cerrar menú"
			>
				<XIcon class="size-5" strokeWidth={1.4} />
			</button>
		</div>

		<nav aria-label="Principal móvil">
			<ul class="flex flex-col gap-1">
				{#each navItems as item, i (item.href)}
					{@const active = isNavActive(pathnameLogical, scrollSpy.active, item.href)}

					<li>
						<Link
							id={i === 0 ? 'site-mobile-nav-first' : undefined}
							href={item.href}
							class={cn(
								navLinkClass,
								// -mx-2 px-2: the chip bleeds into the drawer's padding so the label itself
								// stays flush with the logo above it.
								'-mx-2 block rounded-sm border-b-0 px-2 py-3',
								active && navLinkMobileActiveClass
							)}
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
			<Link
				href={accountHref}
				class={cn(navLinkCompactClass, 'px-1 py-3')}
				onclick={header.closeMenu}
			>
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
				class={cn(navLinkCompactClass, 'inline-flex items-center gap-2 px-1 py-3 text-left')}
				onclick={() => {
					header.closeMenu();
					cart.open();
				}}
				aria-label={cart.count === 1
					? `Carrito, ${cart.count} artículo`
					: `Carrito, ${cart.count} artículos`}
			>
				<ShoppingBagIcon class="size-4 shrink-0" strokeWidth={1.4} />
				Carrito
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
	{/snippet}
</NativeSheet>
