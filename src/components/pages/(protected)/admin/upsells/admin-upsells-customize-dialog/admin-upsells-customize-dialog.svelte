<script lang="ts">
	// Create/edit an upsell rule (§8.2) — one form for both. Two questions: WHEN it shows
	// (trigger) and WHAT it suggests (items). The form never mentions refs/slugs/keys — the
	// pickers (search-driven, one-shot) convert names to identifiers.

	// CONFIG
	import { UPSELLS_CONFIG } from '@/shared/features/upsells/config.js';

	// COMPONENTS
	import NativeDialog from '@/components/ui/native-components/native-dialog/native-dialog.svelte';
	import { Button } from '@/components/ui/button/index.js';
	import AdminUpsellsWhenDisplayed from './admin-upsells-when-displayed/admin-upsells-when-displayed.svelte';
	import AdminUpsellsWhatDisplays from './admin-upsells-what-displays/admin-upsells-what-displays.svelte';
	import AdminUpsellsSaveButton from './admin-upsells-save-button.svelte';

	// UTILS
	import { buildTriggerKey } from '@/shared/features/upsells/utils/upsellsUtils';

	// TYPES
	import type {
		UpsellAdminRule,
		UpsellTrigger
	} from '@/shared/features/upsells/types/upsellsTypes';

	let { existingKeys }: { existingKeys: string[] } = $props();

	let dialog: NativeDialog;
	let rule = $state<UpsellAdminRule | null>(null);
	let editorSession = $state(0);

	export function open(nextRule: UpsellAdminRule | null) {
		rule = nextRule;
		resetForm();
		editorSession += 1;
		dialog.open();
	}

	function dismiss(close: () => void) {
		close();
		resetForm();
		rule = null;
	}

	const MAX = UPSELLS_CONFIG.MAX_ITEMS_PER_RULE;

	// ─── Form state (derived from `rule`, then locally overridable while editing) ───
	const formSeed = $derived.by(() => ({
		kind: rule?.trigger.kind ?? ('product' as const),
		productSlug: rule?.trigger.kind === 'product' ? rule.trigger.slug : '',
		productLabel: rule?.trigger.kind === 'product' ? rule.triggerLabel : '',
		categorySlug: rule?.trigger.kind === 'category' ? rule.trigger.category : '',
		selectedRefs: rule?.items.map((item) => item.ref) ?? []
	}));
	let kind = $derived(formSeed.kind);
	let productSlug = $derived(formSeed.productSlug);
	/** Display name of the picked trigger product (so we can show it without the full catalog). */
	let productLabel = $derived(formSeed.productLabel);
	let categorySlug = $derived(formSeed.categorySlug);
	let selectedRefs = $derived(formSeed.selectedRefs);

	function resetForm() {
		kind = formSeed.kind;
		productSlug = formSeed.productSlug;
		productLabel = formSeed.productLabel;
		categorySlug = formSeed.categorySlug;
		selectedRefs = formSeed.selectedRefs;
	}

	// ─── Trigger + validation ───
	const ruleTrigger = $derived<UpsellTrigger>(
		kind === 'product'
			? { kind: 'product', slug: productSlug }
			: kind === 'category'
				? { kind: 'category', category: categorySlug }
				: { kind: 'global' }
	);
	const triggerKey = $derived(buildTriggerKey(ruleTrigger));
	const ownKey = $derived(rule ? buildTriggerKey(rule.trigger) : null);
	const duplicate = $derived(existingKeys.includes(triggerKey) && triggerKey !== ownKey);

	const triggerValid = $derived(
		kind === 'global' ||
			(kind === 'product' && productSlug !== '') ||
			(kind === 'category' && categorySlug !== '')
	);
	const canSubmit = $derived(
		triggerValid && selectedRefs.length >= 1 && selectedRefs.length <= MAX && !duplicate
	);
</script>

<NativeDialog
	bind:this={dialog}
	class="flex max-w-lg flex-col gap-5 rounded-xl bg-popover p-5 text-popover-foreground ring-1 ring-foreground/10"
>
	{#snippet children({ close })}
		<div class="flex items-start justify-between gap-3">
			<h2 class="text-lg font-semibold">
				{#if rule}
					Editar sugerencia
				{:else}
					Nueva sugerencia
				{/if}
			</h2>

			<Button
				variant="ghost"
				size="icon-sm"
				onclick={() => dismiss(close)}
				aria-label="Cerrar"
				class="-mt-0.5 -mr-1 text-muted-foreground"
			>
				<span class="icon-[lucide--x] size-5"></span>
			</Button>
		</div>

		<!-- 1. WHEN — keyed per editor session so picker search text resets each time. -->
		{#key editorSession}
			<AdminUpsellsWhenDisplayed
				bind:kind
				bind:productSlug
				bind:productLabel
				bind:categorySlug
				{duplicate}
			/>
		{/key}

		<!-- 2. WHAT — the same session key resets item-search internals. -->
		{#key editorSession}
			<AdminUpsellsWhatDisplays
				bind:selectedRefs
				excludeSlug={kind === 'product' ? productSlug : ''}
				{rule}
			/>
		{/key}

		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={() => dismiss(close)}>Cancelar</Button>
			<AdminUpsellsSaveButton
				{rule}
				trigger={ruleTrigger}
				itemRefs={selectedRefs}
				{canSubmit}
				onSaved={() => dismiss(close)}
			/>
		</div>
	{/snippet}
</NativeDialog>
