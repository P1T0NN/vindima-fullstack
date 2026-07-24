<script lang="ts">
	// "¿Qué se sugiere?" — the WHAT half of the rule form (§8.2): search variants and pick up to
	// MAX to offer. Tag-style: the search adds chips, the chips remove. Binds `selectedRefs` back
	// to the dialog (save + validation read it).

	// CONFIG
	import { UPSELLS_CONFIG } from '@/shared/config.js';

	// UTILS
	import { resolvedDisplayName } from '@/shared/features/productVariants/utils/variantDisplayName.js';

	// COMPONENTS
	import AdminUpsellsSelectedItem from './admin-upsells-selected-item.svelte';
	import AdminUpsellsWhatDisplaysSearch from './admin-upsells-what-displays-search.svelte';

	// TYPES
	import type { UpsellAdminRule } from '@/shared/features/upsells/types/upsellsTypes';

	let {
		selectedRefs = $bindable([]),
		excludeSlug = '',
		rule = null
	}: {
		selectedRefs?: string[];
		/** Trigger product slug to exclude — a product can't upsell itself. '' when N/A. */
		excludeSlug?: string;
		/** The rule being edited — seeds chip labels for already-picked items before any search. */
		rule?: UpsellAdminRule | null;
	} = $props();

	const MAX = UPSELLS_CONFIG.MAX_ITEMS_PER_RULE;
	const atCap = $derived(selectedRefs.length >= MAX);

	// Chip labels: seeded from the edited rule, then captured at pick-time from the search (so a
	// chip always shows a name, even after the search clears).
	const seededLabels = $derived(
		new Map((rule?.items ?? []).map((i) => [i.ref, resolvedDisplayName(i)] as const))
	);
	let pickedLabels = $state<Record<string, string>>({});

	const labelFor = (ref: string) => pickedLabels[ref] ?? seededLabels.get(ref) ?? ref;

	function addItem(ref: string, label: string) {
		if (selectedRefs.includes(ref) || selectedRefs.length >= MAX) return;
		pickedLabels = { ...pickedLabels, [ref]: label };
		selectedRefs = [...selectedRefs, ref];
	}

	function removeItem(ref: string) {
		selectedRefs = selectedRefs.filter((r) => r !== ref);
	}
</script>

<div class="flex flex-col gap-2">
	<div class="flex items-center justify-between">
		<p class="text-sm font-medium">¿Qué se sugiere?</p>
		<span class="text-xs text-muted-foreground">{selectedRefs.length} de {MAX}</span>
	</div>

	<!-- Chosen items, in pick order. -->
	{#if selectedRefs.length > 0}
		<div class="flex flex-wrap gap-2">
			{#each selectedRefs as ref (ref)}
				<AdminUpsellsSelectedItem label={labelFor(ref)} onRemove={() => removeItem(ref)} />
			{/each}
		</div>
	{/if}

	<AdminUpsellsWhatDisplaysSearch {excludeSlug} disabled={atCap} onAdd={addItem} />

	{#if atCap}
		<p class="text-xs text-muted-foreground">
			Máximo {MAX} productos. Quita uno para agregar otro.
		</p>
	{/if}
</div>
