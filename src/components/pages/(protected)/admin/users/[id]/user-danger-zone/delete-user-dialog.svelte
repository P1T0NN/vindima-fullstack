<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import { Input } from '@/components/ui/input/index.js';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	/**
	 * Self-contained "Delete…" affordance. Renders its own destructive trigger,
	 * gates the confirm action behind a typed-email match (via `ActionButton`'s
	 * `actionDisabled` prop), and calls the `deleteUser` Convex mutation on
	 * confirm. Navigates to `redirectUrl` after success.
	 *
	 * Admin users get a different dialog: title, description, no confirm input,
	 * and the proceed button is hidden — there's nothing the admin viewing the
	 * dialog can do without first demoting the target. The server enforces the
	 * same rule independently (`ADMIN_CANNOT_BE_DELETED` soft failure) as
	 * defense in depth — any caller bypassing this UI still hits the wall.
	 */
	let {
		userId,
		userEmail,
		redirectUrl,
		role
	}: {
		userId: string;
		userEmail: string;
		redirectUrl?: string;
		role: string;
	} = $props();

	const convex = useConvexClient();

	let typedConfirm = $state('');
	let isPending = $state(false);

	async function confirm() {
		if (role === 'admin' || typedConfirm !== userEmail) return;
		isPending = true;
		try {
			const result = await safeMutation(convex, api.tables.users.userMutations.deleteUser, {
				userId
			});
			if (!toastResult(result)) return;

			typedConfirm = '';
			if (redirectUrl) await appGoto(redirectUrl);
		} finally {
			isPending = false;
		}
	}
</script>

{#snippet deleteForm()}
	{#if role !== 'admin'}
		<Input bind:value={typedConfirm} placeholder={userEmail} disabled={isPending} />
	{/if}
{/snippet}

<ActionButton
	function={confirm}
	variant={role === 'admin' ? 'outline' : 'destructive'}
	{isPending}
	actionDisabled={role === 'admin' || typedConfirm !== userEmail}
	isDestructive={role !== 'admin'}
	hideProceed={role === 'admin'}
	title={role === 'admin' ? `Cannot delete ${userEmail}` : `Delete ${userEmail}?`}
	description={role === 'admin'
		? 'Admins must be demoted to "user" before they can be deleted.'
		: 'This is permanent and cascades to sessions and accounts. Type the email below to confirm.'}
	body={role !== 'admin' ? deleteForm : undefined}
>
	Delete…
</ActionButton>
