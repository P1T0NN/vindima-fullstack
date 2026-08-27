<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import AppSidebar from '@/components/ui/custom-components/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/components/ui/custom-components/app-sidebar/site-header.svelte';

	// TYPES
	import type { AppSidebarNavItems } from '@/components/ui/custom-components/app-sidebar/types.js';

	// CONFIG
	import { FEATURES } from '@/shared/config.js';

	let { children } = $props();

	const navItems: AppSidebarNavItems = {
		navMain: [
			{
				label: 'General',
				items: [
					{
						name: 'Panel',
						url: ADMIN_PAGE_ENDPOINTS.DASHBOARD,
						icon: 'icon-[lucide--layout-dashboard]'
					}
				]
			},
			{
				label: 'Productos',
				items: [
					{
						name: 'Productos',
						url: ADMIN_PAGE_ENDPOINTS.PRODUCTS,
						icon: 'icon-[lucide--package]'
					},
					{
						name: 'Categorías',
						url: ADMIN_PAGE_ENDPOINTS.CATEGORIES,
						icon: 'icon-[lucide--tag]'
					},
					{
						name: 'Recompensas',
						url: ADMIN_PAGE_ENDPOINTS.REWARDS,
						icon: 'icon-[lucide--gift]'
					},
					// Add-to-cart suggestions — hidden when the feature is off.
					...(FEATURES.UPSELLS
						? [
								{
									name: 'Sugerencias',
									url: ADMIN_PAGE_ENDPOINTS.UPSELLS,
									icon: 'icon-[lucide--sparkles]'
								}
							]
						: [])
				]
			},
			{
				label: 'Pedidos',
				items: [
					{
						name: 'Pedidos',
						url: ADMIN_PAGE_ENDPOINTS.ORDERS,
						icon: 'icon-[lucide--shopping-bag]'
					}
				]
			}
		]
	};
</script>

<!-- URL-synced state (`useQueryState`) is provided by the root layout's NuqsAdapter. -->
<Sidebar.Provider
	style="--sidebar-width: calc(var(--spacing) * 72); --header-height: calc(var(--spacing) * 12);"
>
	<AppSidebar variant="inset" {navItems} />

	<Sidebar.Inset>
		<SiteHeader hidePaths={['/admin']} />

		<div class="flex min-h-0 flex-1 flex-col">
			{@render children()}
		</div>
	</Sidebar.Inset>
</Sidebar.Provider>
