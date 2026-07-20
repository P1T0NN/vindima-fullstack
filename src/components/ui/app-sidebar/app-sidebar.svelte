<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// LIBRARIES

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import NavMain from './nav-main.svelte';
	import NavSecondary from './nav-secondary.svelte';
	import NavUser from './nav-user.svelte';
	import Logo from '@/components/ui/logo/logo.svelte';

	// UTILS
	import { isNavItemActive } from '@/utils/isNavItemActive.js';

	// TYPES
	import type { ComponentProps } from 'svelte';
	import type { AppSidebarNavItems } from './types.js';

	let {
		hasLogo = true,
		navItems,
		ref = $bindable(null),
		...restProps
	}: {
		hasLogo?: boolean;
		navItems: AppSidebarNavItems;
	} & ComponentProps<typeof Sidebar.Root> = $props();

	const pathnameLogical = $derived(page.url.pathname);

	const navMainItems = $derived(
		navItems.navMain.map((item) => ({
			...item,
			isActive: isNavItemActive(pathnameLogical, item.url)
		}))
	);

	const navSecondaryItems = $derived(
		navItems.navSecondary?.map((item) => ({
			...item,
			isActive: isNavItemActive(pathnameLogical, item.url)
		}))
	);
</script>

<Sidebar.Root bind:ref class="pt-4" {...restProps}>
	<Sidebar.Header>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				{#if hasLogo}
					<Logo class="size-5!" />
				{:else}
					<span class="truncate px-2 text-base font-semibold text-sidebar-foreground">
						{COMPANY_DATA.NAME}
					</span>
				{/if}
			</Sidebar.MenuItem>
		</Sidebar.Menu>
	</Sidebar.Header>

	<Sidebar.Content>
		<NavMain items={navMainItems} />
		{#if navSecondaryItems}
			<NavSecondary items={navSecondaryItems} class="mt-auto" />
		{/if}
	</Sidebar.Content>

	<Sidebar.Footer>
		<NavUser />
	</Sidebar.Footer>
</Sidebar.Root>
