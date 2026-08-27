<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// LIBRARIES
	import { useAuth } from 'convex-svelte';

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
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import Logo from '@/components/ui/custom-components/logo/logo.svelte';
	import * as Sheet from '@/components/ui/sheet/index.js';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';

	// STATE
	import { cart } from '@/features/cart/cart.svelte';
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';

	const auth = useAuth();
	const isAuthenticated = $derived(auth.isAuthenticated);

	const pathnameLogical = $derived(page.url.pathname);

	const accountHref = $derived(
		isAuthenticated ? PROTECTED_PAGE_ENDPOINTS.ACCOUNT : UNPROTECTED_PAGE_ENDPOINTS.LOGIN
	);
	const accountLabel = $derived(isAuthenticated ? 'Mi cuenta' : 'Iniciar sesi\u00f3n');

	const cta = $derived(resolveHeaderCta(authClass.currentUser, isAuthenticated));
</script>

<Sheet.Root bind:open={header.menuOpen}>
	<Sheet.Trigger
		type="button"
		class="inline-flex size-11 touch-manipulation items-center justify-center rounded-sm text-accent transition-opacity hover:opacity-80 xl:hidden"
		aria-label={header.menuOpen ? 'Cerrar men\u00fa' : 'Abrir men\u00fa'}
	>
		{#if header.menuOpen}
			<span class="icon-[lucide--x] size-5" aria-hidden="true"></span>
		{:else}
			<span class="icon-[lucide--menu] size-5" aria-hidden="true"></span>
		{/if}
	</Sheet.Trigger>

	<Sheet.Content
		side="right"
		class="flex h-full max-h-dvh w-full max-w-80 flex-col gap-5 overflow-x-hidden overflow-y-auto border-border bg-background p-5"
	>
		<Sheet.Header class="sr-only">
			<Sheet.Title>Men&uacute;</Sheet.Title>
			<Sheet.Description>Navegaci&oacute;n principal m&oacute;vil.</Sheet.Description>
		</Sheet.Header>

		<div class="flex min-w-0 items-center justify-between gap-2 pr-12">
			<Logo class="transition-opacity hover:opacity-90" onclick={header.closeMenu} />
		</div>

		<nav aria-label="Principal m&oacute;vil">
			<ul class="flex flex-col gap-1">
				{#each navItems as item, i (item.href)}
					{@const active = isNavActive(pathnameLogical, scrollSpy.active, item.href)}

					<li>
						<Link
							id={i === 0 ? 'site-mobile-nav-first' : undefined}
							href={item.href}
							class={cn(
								navLinkClass,
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
					<span class="icon-[lucide--layout-dashboard] size-3.5 shrink-0" aria-hidden="true"></span>
				{:else}
					<span class="icon-[lucide--sparkles] size-3.5 shrink-0" aria-hidden="true"></span>
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
					? `Carrito, ${cart.count} art\u00edculo`
					: `Carrito, ${cart.count} art\u00edculos`}
			>
				<span class="icon-[lucide--shopping-bag] size-4 shrink-0" aria-hidden="true"></span>
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
	</Sheet.Content>
</Sheet.Root>
