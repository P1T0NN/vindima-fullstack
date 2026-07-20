<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '@/components/ui/select/index.js';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	/**
	 * Filter bar for `/admin/users`. Lives outside the route file so the page can
	 * stay focused on data flow (queryArgs, mutations, dialogs).
	 *
	 * State is bindable — the page owns the values so it can derive `queryArgs`
	 * for the DataTable. Each prop maps 1:1 to a `fetchUsers` arg.
	 */
	let {
		searchField = $bindable<'email' | 'name'>('email'),
		role = $bindable<'user' | 'admin' | undefined>(undefined),
		banned = $bindable<boolean | undefined>(undefined),
		emailVerified = $bindable<boolean | undefined>(undefined)
	}: {
		searchField?: 'email' | 'name';
		role?: 'user' | 'admin' | undefined;
		banned?: boolean | undefined;
		emailVerified?: boolean | undefined;
	} = $props();

	const hasActiveFilter = $derived(
		role !== undefined || banned !== undefined || emailVerified !== undefined
	);

	function clearFilters() {
		role = undefined;
		banned = undefined;
		emailVerified = undefined;
	}
</script>

<Select
	type="single"
	value={searchField}
	onValueChange={(v) => (searchField = (v as 'email' | 'name') || 'email')}
>
	<SelectTrigger class="w-36">
		<span>
			{`Search: ${capitalizeFirst(searchField)}`}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="email">Email</SelectItem>
		<SelectItem value="name">Name</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={role ?? ''}
	onValueChange={(v) => (role = v === '' ? undefined : (v as 'user' | 'admin'))}
>
	<SelectTrigger class="w-32">
		<span>
			{#if role}
				{`Role: ${capitalizeFirst(role)}`}
			{:else}
				Any role
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">Any role</SelectItem>
		<SelectItem value="user">User</SelectItem>
		<SelectItem value="admin">Admin</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={banned === undefined ? '' : String(banned)}
	onValueChange={(v) => (banned = v === '' ? undefined : v === 'true')}
>
	<SelectTrigger class="w-36">
		<span>
			{#if banned === undefined}
				Any status
			{:else if banned}
				Banned
			{:else}
				Active
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">Any status</SelectItem>
		<SelectItem value="true">Banned</SelectItem>
		<SelectItem value="false">Active</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={emailVerified === undefined ? '' : String(emailVerified)}
	onValueChange={(v) => (emailVerified = v === '' ? undefined : v === 'true')}
>
	<SelectTrigger class="w-44">
		<span>
			{#if emailVerified === undefined}
				Any verification
			{:else if emailVerified}
				Verified
			{:else}
				Unverified
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">Any verification</SelectItem>
		<SelectItem value="true">Verified</SelectItem>
		<SelectItem value="false">Unverified</SelectItem>
	</SelectContent>
</Select>

{#if hasActiveFilter}
	<Button variant="ghost" size="sm" onclick={clearFilters}>Clear</Button>
{/if}
