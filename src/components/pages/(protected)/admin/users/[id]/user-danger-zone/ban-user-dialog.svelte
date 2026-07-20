<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import { Input } from '@/components/ui/input/index.js';
	import { Field, FieldLabel } from '@/components/ui/field/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '@/components/ui/select/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	/**
	 * Self-contained "Ban…" affordance: renders its own destructive trigger
	 * button, opens a confirm dialog with a reason input + expiry select via
	 * `ActionButton`'s `body` slot, and calls the `banUser` Convex mutation on
	 * confirm. Parent just drops `<BanUserDialog userId={…} userEmail={…} />`
	 * into the danger zone — no `bind:open` plumbing.
	 *
	 * The mutation owns the auth update + audit row atomically; this dialog is
	 * auth-provider-agnostic.
	 */
	let { userId, userEmail }: { userId: string; userEmail: string } = $props();

	const convex = useConvexClient();

	let reason = $state('');
	/** Seconds-from-now until ban lifts. Empty string = permanent. */
	let expiresIn = $state<string>('');
	let isPending = $state(false);

	async function confirm() {
		isPending = true;
		try {
			const expiresInSec = expiresIn === '' ? undefined : Number(expiresIn);
			const result = await safeMutation(convex, api.tables.users.userMutations.banUser, {
				userId,
				...(reason && { banReason: reason }),
				...(expiresInSec !== undefined && { banExpiresIn: expiresInSec })
			});
			if (!toastResult(result)) return;

			reason = '';
			expiresIn = '';
		} finally {
			isPending = false;
		}
	}
</script>

{#snippet banForm()}
	<div class="flex flex-col gap-3">
		<Field>
			<FieldLabel for="ban-reason">Reason (optional)</FieldLabel>
			<Input
				id="ban-reason"
				bind:value={reason}
				placeholder="Violation of terms…"
				disabled={isPending}
			/>
		</Field>

		<Field>
			<FieldLabel for="ban-expires">Expires</FieldLabel>
			<Select
				type="single"
				value={expiresIn}
				onValueChange={(v) => (expiresIn = v)}
				disabled={isPending}
			>
				<SelectTrigger id="ban-expires">
					<span>
						{#if expiresIn === ''}
							Permanent
						{:else if expiresIn === '86400'}
							1 day
						{:else if expiresIn === '604800'}
							7 days
						{:else if expiresIn === '2592000'}
							30 days
						{/if}
					</span>
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="">Permanent</SelectItem>
					<SelectItem value="86400">1 day</SelectItem>
					<SelectItem value="604800">7 days</SelectItem>
					<SelectItem value="2592000">30 days</SelectItem>
				</SelectContent>
			</Select>
		</Field>
	</div>
{/snippet}

<ActionButton
	function={confirm}
	variant="destructive"
	{isPending}
	title={`Ban ${userEmail}`}
	description="The user is signed out and cannot sign in again until unbanned. The optional reason is shown on next sign-in attempt."
	body={banForm}
>
	Ban
</ActionButton>
