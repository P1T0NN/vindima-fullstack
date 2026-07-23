<script lang="ts">
	// Create/edit an upsell rule (§8.2) — one form for both. Two questions: WHEN it shows
	// (trigger) and WHAT it suggests (items). The form never mentions refs/slugs/keys — pickers
	// translate names to identifiers. Reuses the admin catalog (`fetchRewardCatalog`).

	// LIBRARIES
	import { Dialog } from 'bits-ui';
	import { api } from '@/convex/_generated/api';
	import { useConvexClient, usePaginatedQuery } from '@mmailaender/convex-svelte';

	// CONFIG
	import { CART_CONFIG, PAGINATION_DATA, UPSELLS_CONFIG } from '@/shared/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import CheckoutCardSelect from '@/components/pages/(unprotected)/checkout/checkout-card-select.svelte';
	import { useCategoryOptions } from '@/features/productCategories/hooks/useCategoryOptions.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { cn } from '@/utils/utils.js';
	import { buildTriggerKey } from '@/shared/features/upsells/utils/upsellsUtils';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes';
	import type { UpsellAdminRule, UpsellTrigger } from '@/shared/features/upsells/types/upsellsTypes';

	// LUCIDE ICONS
	import PackageIcon from '@lucide/svelte/icons/package';
	import TagIcon from '@lucide/svelte/icons/tag';
	import StoreIcon from '@lucide/svelte/icons/store';
	import XIcon from '@lucide/svelte/icons/x';
	import CheckIcon from '@lucide/svelte/icons/check';

	let {
		open = $bindable(),
		rule,
		existingKeys
	}: {
		open: boolean;
		/** The rule being edited, or `null` to create a new one. */
		rule: UpsellAdminRule | null;
		/** triggerKeys of every existing rule — for the inline "ya existe" check. */
		existingKeys: string[];
	} = $props();

	const convex = useConvexClient();
	const MAX = UPSELLS_CONFIG.MAX_ITEMS_PER_RULE;
	const money = (minor: number) => formatMoneyMinor(minor, CART_CONFIG.CURRENCY);

	// ─── Form state (seeded from `rule` each time the dialog opens) ───
	let kind = $state<'product' | 'category' | 'global'>('product');
	let productSlug = $state('');
	/** Display name of the picked trigger product (so we can show it without the full catalog). */
	let productLabel = $state('');
	let categorySlug = $state('');
	let selectedRefs = $state<string[]>([]);
	let triggerSearch = $state('');
	let itemSearch = $state('');
	let saving = $state(false);

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
		triggerSearch = '';
		itemSearch = '';
	});

	const categoryOptions = useCategoryOptions();

	// ─── Product search (name → active products + variants) ─────────────────────────────
	// Both pickers are search-driven: nothing loads until the admin types (2+ chars), so we
	// never drain the whole catalog. `fetchAllProducts`' search mode returns products WITH
	// variants attached, which the item picker needs. `'skip'` = no subscription.
	const MIN_SEARCH = 2;
	const triggerTerm = $derived(triggerSearch.trim());
	const itemTerm = $derived(itemSearch.trim());

	// Trigger-product picker: only while choosing a product and none is picked yet.
	const triggerQuery = usePaginatedQuery(
		api.tables.products.queries.fetchAllProducts.fetchAllProducts,
		() =>
			kind === 'product' && !productSlug && triggerTerm.length >= MIN_SEARCH
				? { search: triggerTerm, status: 'active' as const }
				: 'skip',
		{ initialNumItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE }
	);
	const triggerResults = $derived((triggerQuery.results ?? []) as AdminProductRow[]);

	// Item picker.
	const itemQuery = usePaginatedQuery(
		api.tables.products.queries.fetchAllProducts.fetchAllProducts,
		() =>
			itemTerm.length >= MIN_SEARCH ? { search: itemTerm, status: 'active' as const } : 'skip',
		{ initialNumItems: PAGINATION_DATA.DEFAULT_PAGE_SIZE }
	);
	const itemResults = $derived((itemQuery.results ?? []) as AdminProductRow[]);

	// Every sellable variant in the current results, flattened (can't offer a dead item). A
	// product can't upsell itself, so its own variants are dropped when it's the trigger.
	type ItemOption = { ref: string; slug: string; label: string; imageUrl: string | null; priceMinor: number };
	const itemOptions = $derived<ItemOption[]>(
		itemResults.flatMap((p) =>
			p.variants
				.filter((v) => v.available && v.deletedAt === undefined)
				.map((v) => ({
					ref: v.ref,
					slug: p.slug,
					label: v.label ? `${p.name} · ${v.label}` : p.name,
					imageUrl: p.images[0] ?? null,
					priceMinor: v.priceMinor
				}))
		)
	);
	const selectableItems = $derived(
		kind === 'product' && productSlug
			? itemOptions.filter((o) => o.slug !== productSlug)
			: itemOptions
	);

	// Labels for the selected chips: merge the seeded rule items (so edits show names even
	// before searching) with whatever the current search resolved.
	const labelByRef = $derived(
		new Map<string, string>([
			...(rule?.items ?? []).map((i) => [i.ref, i.name] as [string, string]),
			...itemOptions.map((o) => [o.ref, o.label] as [string, string])
		])
	);

	function pickTriggerProduct(p: AdminProductRow) {
		productSlug = p.slug;
		productLabel = p.name;
		triggerSearch = '';
	}
	function clearTriggerProduct() {
		productSlug = '';
		productLabel = '';
	}

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
	const canSave = $derived(
		triggerValid && selectedRefs.length >= 1 && selectedRefs.length <= MAX && !duplicate && !saving
	);

	function toggleItem(ref: string) {
		if (selectedRefs.includes(ref)) {
			selectedRefs = selectedRefs.filter((r) => r !== ref);
		} else if (selectedRefs.length < MAX) {
			selectedRefs = [...selectedRefs, ref];
		}
	}

	const KIND_META = {
		product: { icon: PackageIcon, description: 'Al agregar un producto específico.' },
		category: { icon: TagIcon, description: 'Al agregar cualquier producto de una categoría.' },
		global: { icon: StoreIcon, description: 'Al agregar cualquier producto.' }
	};
	const kindOptions = [
		{ value: 'product', label: 'Un producto' },
		{ value: 'category', label: 'Una categoría' },
		{ value: 'global', label: 'Cualquiera' }
	];

	async function save() {
		if (!canSave) return;
		saving = true;
		try {
			const res = rule
				? await safeMutation(convex, api.tables.upsells.mutations.editUpsellRule.editUpsellRule, {
						ruleId: rule.id as never,
						trigger,
						itemRefs: selectedRefs
					})
				: await safeMutation(
						convex,
						api.tables.upsells.mutations.createUpsellRule.createUpsellRule,
						{ trigger, itemRefs: selectedRefs }
					);
			if (toastResult(res)) open = false;
		} finally {
			saving = false;
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Portal>
		<Dialog.Overlay
			class="fixed inset-0 z-50 bg-black/40 duration-100 data-closed:animate-out data-closed:fade-out-0 data-open:animate-in data-open:fade-in-0"
		/>
		<Dialog.Content
			class="fixed top-1/2 left-1/2 z-50 flex max-h-[90dvh] w-full max-w-lg -translate-x-1/2 -translate-y-1/2 flex-col gap-5 overflow-y-auto rounded-xl bg-popover p-5 text-popover-foreground ring-1 ring-foreground/10 outline-none"
		>
			<div class="flex items-start justify-between gap-3">
				<Dialog.Title class="text-lg font-semibold">
					{rule ? 'Editar sugerencia' : 'Nueva sugerencia'}
				</Dialog.Title>
				<Dialog.Close
					class="-mt-0.5 -mr-1 inline-flex size-8 items-center justify-center rounded-sm text-muted-foreground hover:opacity-70"
					aria-label="Cerrar"
				>
					<XIcon class="size-5" />
				</Dialog.Close>
			</div>

			<!-- 1. WHEN -->
			<div class="flex flex-col gap-2">
				<p class="text-sm font-medium">¿Cuándo se muestra?</p>
				<CheckoutCardSelect
					options={kindOptions}
					selected={kind}
					name="upsell-trigger-kind"
					meta={KIND_META}
					onselect={(v) => (kind = v as typeof kind)}
				/>

				{#if kind === 'product'}
					{#if productSlug}
						<!-- A product is chosen — show it, with a "change" affordance. -->
						<div
							class="mt-1 flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2 text-sm"
						>
							<span class="min-w-0 truncate font-medium">{productLabel || productSlug}</span>
							<button
								type="button"
								class="shrink-0 text-xs text-muted-foreground hover:text-foreground"
								onclick={clearTriggerProduct}
							>
								Cambiar
							</button>
						</div>
					{:else}
						<input
							type="search"
							bind:value={triggerSearch}
							placeholder="Busca el producto…"
							class="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
						/>
						{#if triggerTerm.length >= MIN_SEARCH}
							<div
								class="flex max-h-40 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border"
							>
								{#if triggerQuery.isLoading}
									<p class="px-3 py-4 text-center text-sm text-muted-foreground">Buscando…</p>
								{:else}
									{#each triggerResults as p (p.slug)}
										<button
											type="button"
											onclick={() => pickTriggerProduct(p)}
											class="px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50"
										>
											{p.name}
										</button>
									{:else}
										<p class="px-3 py-4 text-center text-sm text-muted-foreground">
											No se encontraron productos.
										</p>
									{/each}
								{/if}
							</div>
						{/if}
					{/if}
				{:else if kind === 'category'}
					<select
						bind:value={categorySlug}
						class="mt-1 h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
					>
						<option value="" disabled>Elige una categoría…</option>
						{#each categoryOptions.options as opt (opt.value)}
							<option value={opt.value}>{opt.label}</option>
						{/each}
					</select>
				{/if}

				{#if duplicate}
					<p class="text-xs text-destructive">
						Ya existe una sugerencia para este disparador. Edítala en su lugar.
					</p>
				{/if}
			</div>

			<!-- 2. WHAT -->
			<div class="flex flex-col gap-2">
				<div class="flex items-center justify-between">
					<p class="text-sm font-medium">¿Qué se sugiere?</p>
					<span class="text-xs text-muted-foreground">{selectedRefs.length} de {MAX}</span>
				</div>

				<!-- Chosen items, in dialog order. -->
				{#if selectedRefs.length > 0}
					<div class="flex flex-wrap gap-2">
						{#each selectedRefs as ref (ref)}
							<span
								class="inline-flex items-center gap-1.5 rounded-md border border-primary bg-primary/12 py-1 pr-1 pl-2 text-xs"
							>
								<span class="max-w-40 truncate">{labelByRef.get(ref) ?? ref}</span>
								<button
									type="button"
									class="inline-flex size-4 items-center justify-center rounded-full hover:bg-primary/20"
									aria-label="Quitar"
									onclick={() => toggleItem(ref)}
								>
									<XIcon class="size-3" />
								</button>
							</span>
						{/each}
					</div>
				{/if}

				<input
					type="search"
					bind:value={itemSearch}
					placeholder="Buscar productos…"
					class="h-10 w-full rounded-md border border-border bg-background px-3 text-sm"
				/>

				{#if itemTerm.length < MIN_SEARCH}
					<p
						class="rounded-md border border-dashed border-border px-3 py-6 text-center text-sm text-muted-foreground"
					>
						Escribe para buscar productos.
					</p>
				{:else}
					<div class="flex max-h-56 flex-col divide-y divide-border overflow-y-auto rounded-md border border-border">
						{#if itemQuery.isLoading}
							<p class="px-3 py-6 text-center text-sm text-muted-foreground">Buscando…</p>
						{:else}
							{#each selectableItems as opt (opt.ref)}
								{@const picked = selectedRefs.includes(opt.ref)}
								{@const atCap = !picked && selectedRefs.length >= MAX}
								<button
									type="button"
									disabled={atCap}
									onclick={() => toggleItem(opt.ref)}
									class={cn(
										'flex items-center gap-3 px-3 py-2 text-left transition-colors',
										picked ? 'bg-primary/12' : 'hover:bg-muted/50',
										atCap && 'cursor-not-allowed opacity-40'
									)}
								>
									<span class="size-8 shrink-0 overflow-hidden rounded bg-muted">
										{#if opt.imageUrl}
											<img src={opt.imageUrl} alt="" class="size-full object-cover" />
										{/if}
									</span>
									<span class="min-w-0 flex-1">
										<span class="block truncate text-sm">{opt.label}</span>
										<span class="text-xs text-muted-foreground">{money(opt.priceMinor)}</span>
									</span>
									{#if picked}
										<CheckIcon class="size-4 shrink-0 text-primary" strokeWidth={2.5} />
									{/if}
								</button>
							{:else}
								<p class="px-3 py-6 text-center text-sm text-muted-foreground">
									No se encontraron productos.
								</p>
							{/each}
						{/if}
					</div>
				{/if}
			</div>

			<div class="flex justify-end gap-2">
				<Dialog.Close class="inline-flex">
					{#snippet child({ props })}
						<Button {...props} variant="outline">Cancelar</Button>
					{/snippet}
				</Dialog.Close>
				<Button onclick={save} disabled={!canSave}>
					{saving ? 'Guardando…' : rule ? 'Guardar cambios' : 'Crear sugerencia'}
				</Button>
			</div>
		</Dialog.Content>
	</Dialog.Portal>
</Dialog.Root>
