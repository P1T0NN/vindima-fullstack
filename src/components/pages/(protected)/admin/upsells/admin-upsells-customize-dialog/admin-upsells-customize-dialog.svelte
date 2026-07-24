<script lang="ts">
	// Create/edit an upsell rule (§8.2) — one form for both. Two questions: WHEN it shows
	// (trigger) and WHAT it suggests (items). The form never mentions refs/slugs/keys — the
	// pickers (search-driven, one-shot) translate names to identifiers.

	// CONFIG
	import { UPSELLS_CONFIG } from '@/shared/config.js';

	// COMPONENTS
	import { NativeDialog } from '@/components/ui/native-dialog/index.js';
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

	// LUCIDE ICONS
	import XIcon from '@lucide/svelte/icons/x';

	let {
		open = $bindable(),
		dialogId,
		rule,
		existingKeys
	}: {
		open: boolean;
		/** Page-known dialog id so `<NativeDialogTrigger>`s elsewhere can open this natively. */
		dialogId?: string;
		/** The rule being edited, or `null` to create a new one. */
		rule: UpsellAdminRule | null;
		/** triggerKeys of every existing rule — for the inline "ya existe" check. */
		existingKeys: string[];
	} = $props();

	const MAX = UPSELLS_CONFIG.MAX_ITEMS_PER_RULE;

	// ─── Form state (seeded from `rule` each time the dialog opens) ───
	let kind = $state<'product' | 'category' | 'global'>('product');
	let productSlug = $state('');
	/** Display name of the picked trigger product (so we can show it without the full catalog). */
	let productLabel = $state('');
	let categorySlug = $state('');
	let selectedRefs = $state<string[]>([]);

	$effect(() => {
		if (!open) return;
		// Seed on open — reads `rule`; writes don't create deps so this won't loop.
		if (rule) {
			kind = rule.trigger.kind;
			productSlug = rule.trigger.kind === 'product' ? rule.trigger.slug : '';
			productLabel = rule.trigger.kind === 'product' ? rule.triggerLabel : '';
			categorySlug = rule.trigger.kind === 'category' ? rule.trigger.category : '';
			selectedRefs = rule.items.map((i) => i.ref);
		} else {
			kind = 'product';
			productSlug = '';
			productLabel = '';
			categorySlug = '';
			selectedRefs = [];
		}
	});

	// ─── Trigger + validation ───
	const trigger = $derived<UpsellTrigger>(
		kind === 'product'
			? { kind: 'product', slug: productSlug }
			: kind === 'category'
				? { kind: 'category', category: categorySlug }
				: { kind: 'global' }
	);
	const triggerKey = $derived(buildTriggerKey(trigger));
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
	bind:open
	id={dialogId}
	title={rule ? 'Editar sugerencia' : 'Nueva sugerencia'}
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
				onclick={close}
				aria-label="Cerrar"
				class="-mt-0.5 -mr-1 text-muted-foreground"
			>
				<XIcon class="size-5" />
			</Button>
		</div>

		<!-- 1. WHEN — keyed on `open` so picker internals (search text) reset each time. -->
		{#key open}
			<AdminUpsellsWhenDisplayed
				bind:kind
				bind:productSlug
				bind:productLabel
				bind:categorySlug
				{duplicate}
			/>
		{/key}

		<!-- 2. WHAT — keyed on `open` so the item search resets each time. -->
		{#key open}
			<AdminUpsellsWhatDisplays
				bind:selectedRefs
				excludeSlug={kind === 'product' ? productSlug : ''}
				{rule}
			/>
		{/key}

		<div class="flex justify-end gap-2">
			<Button variant="outline" onclick={close}>Cancelar</Button>
			<AdminUpsellsSaveButton
				{rule}
				{trigger}
				itemRefs={selectedRefs}
				{canSubmit}
				onSaved={() => (open = false)}
			/>
		</div>
	{/snippet}
</NativeDialog>
