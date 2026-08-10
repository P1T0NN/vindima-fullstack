<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from '@mmailaender/convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { Label } from '@/components/ui/label/index.js';

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

	const uid = $props.id();

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
		<div class="flex flex-col gap-1.5">
			<Label for="{uid}-confirm">Escribe el correo para confirmar</Label>
			<Input
				id="{uid}-confirm"
				bind:value={typedConfirm}
				placeholder={userEmail}
				disabled={isPending}
				aria-describedby="{uid}-confirm-hint"
			/>
			<p id="{uid}-confirm-hint" class="text-xs text-muted-foreground">
				Escribe {userEmail} exactamente. La eliminación es permanente.
			</p>
		</div>
	{/if}
{/snippet}

<ActionButton
	function={confirm}
	variant={role === 'admin' ? 'outline' : 'destructive'}
	{isPending}
	actionDisabled={role === 'admin' || typedConfirm !== userEmail}
	isDestructive={role !== 'admin'}
	hideProceed={role === 'admin'}
	title={role === 'admin' ? `No se puede eliminar a ${userEmail}` : `¿Eliminar a ${userEmail}?`}
	description={role === 'admin'
		? 'Los admins deben ser degradados a "usuario" antes de poder eliminarlos.'
		: 'Esto es permanente y se extiende a sesiones y cuentas. Escribe el correo abajo para confirmar.'}
	body={role !== 'admin' ? deleteForm : undefined}
>
	Eliminar...
</ActionButton>
