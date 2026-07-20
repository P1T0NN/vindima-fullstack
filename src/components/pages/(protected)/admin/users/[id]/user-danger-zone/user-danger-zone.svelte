<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import UserDangerZoneItem from './user-danger-zone-item.svelte';
	import ChangeRoleButton from './change-role-button.svelte';
	import UnbanUserButton from './unban-user-button.svelte';
	import BanUserDialog from './ban-user-dialog.svelte';
	import DeleteUserDialog from './delete-user-dialog.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	let { user }: { user: Doc<'user'> } = $props();
</script>

<div class="flex flex-col gap-4 rounded-lg border border-destructive/40 p-4">
	<header class="flex flex-col gap-1">
		<h2 class="text-base font-semibold text-destructive">Danger zone</h2>
		<p class="text-sm text-muted-foreground">
			Account-level actions. Changes here are audited and may be irreversible.
		</p>
	</header>

	<UserDangerZoneItem
		title={`Role: ${capitalizeFirst(user.role)}`}
		description={user.role === 'admin'
			? 'Remove admin privileges from this account.'
			: 'Grant admin privileges to this account.'}
	>
		<ChangeRoleButton userId={user._id} userEmail={user.email} role={user.role} />
	</UserDangerZoneItem>

	<UserDangerZoneItem
		title={user.banned ? 'Banned' : 'Active'}
		description={user.banned
			? 'Lift the ban so the user can sign in again.'
			: 'Sign the user out and prevent further sign-ins.'}
	>
		{#if user.banned}
			<UnbanUserButton userId={user._id} />
		{:else}
			<BanUserDialog userId={user._id} userEmail={user.email} />
		{/if}
	</UserDangerZoneItem>

	<DeleteUserDialog
		userId={user._id}
		userEmail={user.email}
		role={user.role}
		redirectUrl={ADMIN_PAGE_ENDPOINTS.USERS}
	/>
</div>
