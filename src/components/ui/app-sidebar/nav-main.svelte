<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';

	// TYPES
	import type { AppSidebarNavItemWithActive } from './types.js';

	let {
		items
	}: {
		items: AppSidebarNavItemWithActive[];
	} = $props();
</script>

<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
	<Sidebar.GroupLabel>Navegación</Sidebar.GroupLabel>

	<Sidebar.Menu class="gap-2">
		{#each items as item (item.name)}
			<Sidebar.MenuItem>
				<Sidebar.MenuButton isActive={item.isActive}>
					{#snippet child({ props })}
						<a href={item.url} {...props}>
							<item.icon />
							<span>{item.name}</span>
						</a>
					{/snippet}
				</Sidebar.MenuButton>
			</Sidebar.MenuItem>
		{/each}
	</Sidebar.Menu>
</Sidebar.Group>
