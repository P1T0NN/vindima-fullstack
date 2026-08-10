<script lang="ts">
	// The rule builder's save button — owns the create/edit mutation and its own pending state.
	// The dialog hands it validated inputs + `onSaved` (which closes the dialog on success).

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from '@mmailaender/convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

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

	const convex = useConvexClient();
	let saving = $state(false);

	async function save() {
		if (!canSubmit || saving) return;
		saving = true;
		try {
			const res = rule
				? await safeMutation(convex, api.tables.upsells.mutations.editUpsellRule.editUpsellRule, {
						ruleId: rule.id as never,
						trigger,
						itemRefs
					})
				: await safeMutation(
						convex,
						api.tables.upsells.mutations.createUpsellRule.createUpsellRule,
						{ trigger, itemRefs }
					);
			if (toastResult(res)) onSaved();
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
