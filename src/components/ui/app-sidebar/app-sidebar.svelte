<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';
	import { resolve } from '$app/paths';

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

	// LUCIDE ICONS
	import HouseIcon from '@lucide/svelte/icons/house';

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

	const navMainGroups = $derived(
		navItems.navMain.map((group) => ({
			...group,
			items: group.items.map((item) => ({
				...item,
				isActive: isNavItemActive(pathnameLogical, item.url)
			}))
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
		<NavMain groups={navMainGroups} />
		{#if navSecondaryItems}
			<NavSecondary items={navSecondaryItems} class="mt-auto" />
		{/if}
	</Sidebar.Content>

	<Sidebar.Footer>
		<Sidebar.Menu>
			<Sidebar.MenuItem>
				<Sidebar.MenuButton tooltipContent="Volver al inicio">
					{#snippet child({ props })}
						<a href={resolve('/')} {...props}>
							<HouseIcon />
							<span>Volver al inicio</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		</Sidebar.Menu>
		<NavUser />
	</Sidebar.Footer>
</Sidebar.Root>
