<script lang="ts">
	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// LIBRARIES
	import { useAuth } from '@mmailaender/convex-better-auth-svelte/svelte';

	// COMPONENTS
	import * as Avatar from '@/components/ui/avatar/index.js';
	import * as DropdownMenu from '@/components/ui/dropdown-menu/index.js';
	import * as Sidebar from '@/components/ui/sidebar/index.js';
	import { Spinner } from '@/components/ui/spinner/index.js';
	import LogoutButton from '@/features/auth/components/logout-button/logout-button.svelte';

	// LUCIDE ICONS
	import ChevronsUpDownIcon from '@lucide/svelte/icons/chevrons-up-down';

	const sidebar = Sidebar.useSidebar();

	const auth = useAuth();

	const user = $derived(authClass.currentUser);
	const userLoading = $derived(authClass.userLoading);
	/** Avoid “Account” flash before auth + Convex have settled. */
	const showUserLoading = $derived(
		auth.isLoading || userLoading || (auth.isAuthenticated && user === undefined)
	);
</script>

<Sidebar.Menu>
	<Sidebar.MenuItem>
		<DropdownMenu.Root>
			<DropdownMenu.Trigger disabled={showUserLoading}>
				{#snippet child({ props })}
					<Sidebar.MenuButton
						size="lg"
						class="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
						{...props}
					>
						{#if showUserLoading}
							<div
								class="flex size-8 shrink-0 items-center justify-center rounded-lg bg-sidebar-accent/30"
								aria-hidden="true"
							>
								<Spinner class="size-4 text-sidebar-foreground" />
							</div>
						{:else}
							<Avatar.Root class="size-8 rounded-lg">
								<Avatar.Image src={user?.image} alt={user?.name ?? ''} />
								<Avatar.Fallback class="rounded-lg">CN</Avatar.Fallback>
							</Avatar.Root>

							<div class="grid flex-1 text-start text-sm leading-tight">
								<span class="truncate font-medium">{user?.name ?? 'Cuenta'}</span>
								<span class="truncate text-xs text-muted-foreground">{user?.email ?? ''}</span>
							</div>
						{/if}

						<ChevronsUpDownIcon class="ms-auto size-4 shrink-0" />
					</Sidebar.MenuButton>
				{/snippet}
			</DropdownMenu.Trigger>

			<DropdownMenu.Content
				class="w-(--bits-dropdown-menu-anchor-width) min-w-56 rounded-lg p-1"
				side={sidebar.isMobile ? 'bottom' : 'right'}
				align="end"
				sideOffset={4}
			>
				<LogoutButton
					class="w-full justify-start"
					onClick={() => {
						if (sidebar.isMobile) sidebar.setOpenMobile(false);
					}}
				/>
			</DropdownMenu.Content>
		</DropdownMenu.Root>
	</Sidebar.MenuItem>
</Sidebar.Menu>
