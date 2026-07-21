<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import * as Sidebar from '@/components/ui/sidebar/index.js';

	// TYPES
	import type { AppSidebarNavGroupWithActive } from './types.js';

	let {
		groups
	}: {
		groups: AppSidebarNavGroupWithActive[];
	} = $props();
</script>

{#each groups as group (group.label)}
	<Sidebar.Group class="group-data-[collapsible=icon]:hidden">
		<Sidebar.GroupLabel>{group.label}</Sidebar.GroupLabel>

		<Sidebar.Menu class="gap-2">
			{#each group.items as item (item.name)}
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
{/each}
