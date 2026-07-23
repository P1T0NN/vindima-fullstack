<script lang="ts">
	// LIBRARIES
	import { NuqsAdapter } from 'nuqs-svelte/adapters/svelte-kit';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import AppSidebar from '@/components/ui/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/components/ui/app-sidebar/site-header.svelte';

	// TYPES
	import type { AppSidebarNavItems } from '@/components/ui/app-sidebar/types.js';

	// LUCIDE ICONS
	import FrameIcon from '@lucide/svelte/icons/frame';
	import PieChartIcon from '@lucide/svelte/icons/pie-chart';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TagIcon from '@lucide/svelte/icons/tag';
	import GiftIcon from '@lucide/svelte/icons/gift';
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';
	import SparklesIcon from '@lucide/svelte/icons/sparkles';

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
						icon: FrameIcon
					},
					{
						name: 'Usuarios',
						url: ADMIN_PAGE_ENDPOINTS.USERS,
						icon: PieChartIcon
					}
				]
			},
			{
				label: 'Productos',
				items: [
					{
						name: 'Productos',
						url: ADMIN_PAGE_ENDPOINTS.PRODUCTS,
						icon: PackageIcon
					},
					{
						name: 'Categorías',
						url: ADMIN_PAGE_ENDPOINTS.CATEGORIES,
						icon: TagIcon
					},
					{
						name: 'Recompensas',
						url: ADMIN_PAGE_ENDPOINTS.REWARDS,
						icon: GiftIcon
					},
					// Add-to-cart suggestions — hidden when the feature is off.
					...(FEATURES.UPSELLS
						? [
								{
									name: 'Sugerencias',
									url: ADMIN_PAGE_ENDPOINTS.UPSELLS,
									icon: SparklesIcon
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
						icon: ShoppingBagIcon
					}
				]
			}
		]
	};
</script>

<!-- NuqsAdapter: enables `useQueryState` URL-synced state for admin pages (e.g. the orders
     status filter). Scoped here — only the admin area uses URL-as-state. -->
<NuqsAdapter>
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
</NuqsAdapter>
