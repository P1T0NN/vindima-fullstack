<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery, useConvexClient } from 'convex-svelte';
	import { authClient } from '@/features/auth/lib/auth-client';
	import { SvelteSet } from 'svelte/reactivity';

	// LIBRARIES

	// CLASSES
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatTs } from '@/shared/utils/dateUtils';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	let { userId }: { userId: string } = $props();

	const convex = useConvexClient();

	const sessionsQuery = useQuery(api.tables.users.userQueries.fetchUserSessions, () => ({
		userId
	}));
	const sessions = $derived((sessionsQuery.data ?? []) as Doc<'session'>[]);

	/**
	 * Tracks which session tokens have an in-flight revoke. Used to disable the
	 * per-row button so a double-click can't fire two mutations. Set of tokens
	 * keeps it independent of array index, which changes as sessions disappear.
	 */
	/**
	 * Tracks which session tokens currently have an in-flight revoke. `SvelteSet`
	 * is reactive on `.add`/`.delete` so per-row buttons re-render without us
	 * having to swap in a fresh Set instance.
	 */
	const revokingTokens = new SvelteSet<string>();
	let isRevokingAll = $state(false);

	/**
	 * After a self-targeted revoke, the BA session this admin is using may have
	 * just died — we can't tell from a token alone, so we conservatively sign
	 * out and bounce to login when the target user is ourselves. Worst case the
	 * killed session was on another device and the admin just re-logs in; best
	 * case (and the common one) the redirect is exactly right.
	 */
	async function bounceIfSelf() {
		const me = authClass.currentUser?._id;
		if (!me || me !== userId) return;
		await authClient.signOut().catch(() => {});
		appGoto(UNPROTECTED_PAGE_ENDPOINTS.LOGIN);
	}

	async function revokeOne(session: Doc<'session'>) {
		if (revokingTokens.has(session.token)) return;
		revokingTokens.add(session.token);
		try {
			const result = await safeMutation(convex, api.tables.users.userMutations.revokeSession, {
				sessionToken: session.token,
				userId
			});
			if (!toastResult(result)) return;

			await bounceIfSelf();
		} finally {
			revokingTokens.delete(session.token);
		}
	}

	async function revokeAll() {
		isRevokingAll = true;
		try {
			const result = await safeMutation(convex, api.tables.users.userMutations.revokeAllSessions, {
				userId
			});
			if (!toastResult(result)) return;

			await bounceIfSelf();
		} finally {
			isRevokingAll = false;
		}
	}
</script>

<div class="flex flex-col gap-4">
	<header class="flex flex-col items-start justify-between gap-2 md:flex-row md:items-center">
		<div class="flex flex-col gap-0.5">
			<h2 class="text-base font-semibold">Active sessions</h2>
			<p class="text-sm text-muted-foreground">
				Devices currently signed in. Revoking signs the device out immediately.
			</p>
		</div>
		<Button
			variant="destructive"
			onclick={revokeAll}
			disabled={isRevokingAll || sessions.length === 0}
		>
			Revoke all
		</Button>
	</header>

	{#if sessionsQuery.error}
		<p class="text-sm text-destructive">Failed to load sessions.</p>
	{:else if sessionsQuery.data === undefined}
		<div class="flex flex-col gap-2">
			<Skeleton class="h-16 w-full" />
			<Skeleton class="h-16 w-full" />
		</div>
	{:else if sessions.length === 0}
		<p class="text-sm text-muted-foreground">No active sessions.</p>
	{:else}
		<ul class="flex flex-col gap-2">
			{#each sessions as session (session.token)}
				<li
					class="flex flex-col items-start justify-between gap-2 rounded-md border p-3 md:flex-row md:items-center"
				>
					<div class="flex min-w-0 flex-1 flex-col gap-1">
						<span class="text-sm font-medium break-all" title={session.userAgent ?? ''}>
							{session.userAgent || 'Unknown device'}
						</span>

						<div class="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
							<span>IP: {session.ipAddress || '—'}</span>
							<span>Created: {formatTs(session.createdAt)}</span>
							<span>Expires: {formatTs(session.expiresAt)}</span>
						</div>
					</div>

					<Button
						variant="outline"
						size="sm"
						onclick={() => revokeOne(session)}
						disabled={revokingTokens.has(session.token)}
					>
						Revoke
					</Button>
				</li>
			{/each}
		</ul>
	{/if}
</div>
