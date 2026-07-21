<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { PAGINATION_DATA } from '@/shared/config.js';

	// CLASSES
	import { productCategoriesClass } from '@/features/products/classes/productCategoriesClass.svelte';

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import AppSidebar from '@/components/ui/app-sidebar/app-sidebar.svelte';
	import SiteHeader from '@/components/ui/app-sidebar/site-header.svelte';

	// TYPES
	import type { AppSidebarNavItems } from '@/components/ui/app-sidebar/types.js';
	import type { Doc } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import FrameIcon from '@lucide/svelte/icons/frame';
	import PieChartIcon from '@lucide/svelte/icons/pie-chart';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TagIcon from '@lucide/svelte/icons/tag';
	import GiftIcon from '@lucide/svelte/icons/gift';
	import ShoppingBagIcon from '@lucide/svelte/icons/shopping-bag';

	let { children } = $props();

	// THE one categories subscription for the whole admin area — mirrored into
	// `productCategoriesClass` so pages/components read it without re-subscribing
	// (same pattern as `authClass` in the root layout).
	const categoriesQuery = useQuery(
		api.tables.productCategories.queries.fetchAllCategories.fetchAllCategories,
		() => ({ paginationOpts: { numItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE, cursor: null } })
	);
	$effect(() => {
		productCategoriesClass.syncFromCategoriesQuery(
			categoriesQuery.data?.page as Doc<'productCategories'>[] | undefined,
			categoriesQuery.isLoading,
			categoriesQuery.error
		);
	});

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
					}
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
