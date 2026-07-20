<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar/index.js';
	import CopyButton from '@/components/ui/copy-button/copy-button.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	let { user }: { user: Doc<'user'> } = $props();

	const displayName = $derived(capitalizeFirst(user.name || user.email));
	const createdAt = $derived(new Date(user._creationTime).toLocaleString());
	const updatedAt = $derived(new Date(user.updatedAt).toLocaleString());
	const banExpiresAt = $derived(
		user.banExpires ? new Date(user.banExpires).toLocaleString() : null
	);
</script>

{#snippet field(label: string, value: string)}
	<div class="flex flex-col gap-0.5">
		<span class="text-xs tracking-wide text-muted-foreground uppercase">{label}</span>
		<span class="text-sm">{value}</span>
	</div>
{/snippet}

<div class="flex flex-col gap-6">
	<div class="flex items-center gap-4">
		<Avatar class="size-16">
			{#if user.image}
				<AvatarImage src={user.image} alt={displayName} />
			{/if}
			<AvatarFallback>{displayName.slice(0, 2).toUpperCase()}</AvatarFallback>
		</Avatar>

		<div class="flex flex-col gap-1">
			<h2 class="text-lg font-semibold">{displayName}</h2>
			<div class="flex items-center gap-2 text-sm">
				<span class="text-muted-foreground">{user.email}</span>
				{#if user.emailVerified}
					<span
						class="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-900 dark:bg-emerald-900/40 dark:text-emerald-200"
					>
						Verified
					</span>
				{:else}
					<span
						class="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
					>
						Unverified
					</span>
				{/if}
			</div>
		</div>
	</div>

	<div class="grid grid-cols-1 gap-4 md:grid-cols-2">
		{@render field('Role', capitalizeFirst(user.role))}
		{@render field(
			'Status',
			user.banned
				? banExpiresAt
					? `Banned until ${banExpiresAt}`
					: 'Banned (permanent)'
				: 'Active'
		)}
		{#if user.banned && user.banReason}
			{@render field('Ban reason', user.banReason)}
		{/if}
		{@render field('Created', createdAt)}
		{@render field('Updated', updatedAt)}
	</div>

	<div class="flex flex-col gap-2">
		<span class="text-xs tracking-wide text-muted-foreground uppercase">User ID</span>
		<div class="flex items-center gap-2">
			<code class="rounded bg-muted px-2 py-1 font-mono text-xs">{user._id}</code>
			<CopyButton value={user._id} label="Copy user ID" />
		</div>
	</div>
</div>
