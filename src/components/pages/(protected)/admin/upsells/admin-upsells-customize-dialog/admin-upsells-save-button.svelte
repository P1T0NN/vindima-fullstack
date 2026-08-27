<script lang="ts">
	// The rule builder's save button — owns the create/edit mutation and its own pending state.
	// The dialog hands it validated inputs + `onSaved` (which closes the dialog on success).

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
import { hasErrorMessage } from '@/shared/utils/errorMessage';

	// TYPES
	import type {
		UpsellAdminRule,
		UpsellTrigger
	} from '@/shared/features/upsells/types/upsellsTypes';

	let {
		rule,
		trigger,
		itemRefs,
		canSubmit,
		onSaved
	}: {
		/** The rule being edited, or `null` to create — drives the label + which mutation runs. */
		rule: UpsellAdminRule | null;
		trigger: UpsellTrigger;
		itemRefs: string[];
		/** Form validity, minus the pending state (this button owns that). */
		canSubmit: boolean;
		/** Called after a successful save — the dialog closes. */
		onSaved: () => void;
	} = $props();

	const editUpsellRule = useMutation(api.tables.upsells.mutations.editUpsellRule.editUpsellRule);
	const createUpsellRule = useMutation(
		api.tables.upsells.mutations.createUpsellRule.createUpsellRule
	);
	let saving = $state(false);

	async function save() {
		if (!canSubmit || saving) return;
		saving = true;
		try {
			let result;
			try {
				result = rule
					? await editUpsellRule({ ruleId: rule.id as never, trigger, itemRefs })
					: await createUpsellRule({ trigger, itemRefs });
			} catch (error) {
				if (error instanceof ConvexError && hasErrorMessage(error.data)) {
					toastMessage({
						type: 'error',
						error,
						message: error.data.message
					});
				} else if (isRateLimitError(error)) {
					toastMessage({ type: 'error', error, message: '' });
				} else {
					throw error;
				}
				return;
			}
			const message = result.message;
			if (!result.success) {
				toastMessage({ type: 'error', error: null, message });
				return;
			}
			toastMessage({ type: 'success', message });

			onSaved();
		} finally {
			saving = false;
		}
	}
</script>

<Button onclick={save} disabled={!canSubmit || saving}>
	{#if saving}
		<Spinner class="size-3.5" />
		Guardando...
	{:else if rule}
		Guardar cambios
	{:else}
		Crear sugerencia
	{/if}
</Button>
