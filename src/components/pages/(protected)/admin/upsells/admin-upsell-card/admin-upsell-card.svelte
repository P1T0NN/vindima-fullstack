<script lang="ts">
	// One rule as a readable sentence with thumbnails (§8.1). Problems are badges, not breakage:
	// dead items/triggers get a ⚠ but the rule keeps working with its healthy items.

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';

	// COMPONENTS
	import { Switch } from '@/components/ui/switch/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import ActionButton from '@/components/ui/action-button/action-button.svelte';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
	import { resolvedDisplayName } from '@/shared/features/productVariants/utils/variantDisplayName.js';
import { hasErrorMessage } from '@/shared/utils/errorMessage';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { UpsellAdminRule } from '@/shared/features/upsells/types/upsellsTypes';

	let {
		rule,
		editingRule = $bindable(null),
		builderOpen = $bindable(false)
	}: {
		rule: UpsellAdminRule;
		/** The builder's current rule + open state — this card opens the dialog on itself. */
		editingRule?: UpsellAdminRule | null;
		builderOpen?: boolean;
	} = $props();

	const setUpsellRuleEnabled = useMutation(
		api.tables.upsells.mutations.setUpsellRuleEnabled.setUpsellRuleEnabled
	);
	const deleteUpsellRule = useMutation(
		api.tables.upsells.mutations.deleteUpsellRule.deleteUpsellRule
	);

	let togglePending = $state(false);
	let deletePending = $state(false);

	// How many offered items no longer resolve — surfaced as one warning line, not breakage.
	const brokenItems = $derived(rule.items.filter((i) => i.status !== 'ok').length);
	const triggerBroken = $derived(rule.triggerStatus === 'missing');

	function edit() {
		editingRule = rule;
		builderOpen = true;
	}

	async function toggle(next: boolean) {
		if (togglePending) return;
		togglePending = true;
		try {
			let result;
			try {
				result = await setUpsellRuleEnabled({ ruleId: rule.id as never, enabled: next });
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
		} finally {
			togglePending = false;
		}
	}

	async function remove() {
		if (deletePending) return;
		deletePending = true;
		try {
			let result;
			try {
				result = await deleteUpsellRule({ ruleId: rule.id as never });
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
		} finally {
			deletePending = false;
		}
	}
</script>

<div
	class={cn(
		'flex flex-col gap-3 rounded-lg border border-border p-4',
		!rule.enabled && 'opacity-70'
	)}
>
	<div class="flex items-start justify-between gap-3">
		<!-- The trigger, as prose. -->
		<p class="text-sm leading-relaxed">
			<span class="text-muted-foreground">Cuando se agrega</span>
			{#if rule.trigger.kind === 'product'}
				<span class="font-medium">{rule.triggerLabel}</span>
			{:else if rule.trigger.kind === 'category'}
				<span class="text-muted-foreground">cualquier producto de</span>
				<span class="font-medium">"{rule.triggerLabel}"</span>
			{:else}
				<span class="font-medium">cualquier producto</span>
				<span class="text-muted-foreground">(regla general)</span>
			{/if}
			{#if triggerBroken}
				<span class="ml-1 inline-flex items-center gap-1 text-xs text-destructive">
					<span class="icon-[lucide--triangle-alert] size-3.5"></span> ya no existe
				</span>
			{/if}
		</p>

		<div class="flex items-center gap-2" aria-busy={togglePending}>
			{#if togglePending}<Spinner class="size-3.5" />{/if}
			<Switch
				checked={rule.enabled}
				disabled={togglePending}
				onCheckedChange={toggle}
				aria-label={rule.enabled ? 'Desactivar sugerencia' : 'Activar sugerencia'}
			/>
		</div>
	</div>

	<!-- Offered items, in fire order. -->
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-xs text-muted-foreground">sugerir:</span>
		{#each rule.items as item (item.ref)}
			{@const dead = item.status !== 'ok'}
			{@const itemName = resolvedDisplayName(item)}
			<span
				class={cn(
					'inline-flex items-center gap-1.5 rounded-md border border-border py-1 pr-2 pl-1 text-xs',
					dead && 'text-muted-foreground line-through opacity-70'
				)}
				title={item.status === 'missing'
					? 'Ya no existe'
					: item.status === 'unavailable'
						? 'No disponible'
						: itemName}
			>
				<span class="size-6 shrink-0 overflow-hidden rounded bg-muted">
					{#if item.imageUrl}
						<img src={item.imageUrl} alt="" class="size-full object-cover" />
					{/if}
				</span>
				<span class="max-w-40 truncate">{itemName}</span>
			</span>
		{/each}
	</div>

	{#if brokenItems > 0}
		<p class="inline-flex items-center gap-1 text-xs text-destructive">
			<span class="icon-[lucide--triangle-alert] size-3.5"></span>
			{brokenItems === 1
				? '1 artículo ya no está disponible'
				: `${brokenItems} artículos ya no están disponibles`}. Edita la sugerencia para corregirlo.
		</p>
	{/if}

	<div class="flex items-center justify-end gap-2">
		<Button variant="outline" size="sm" onclick={edit}>
			<span class="icon-[lucide--pencil] size-3.5"></span>
			Editar
		</Button>

		<ActionButton
			function={remove}
			variant="destructive"
			size="sm"
			isDestructive
			isPending={deletePending}
			title={rule.trigger.kind === 'global'
				? '¿Eliminar la sugerencia general?'
				: `¿Eliminar la sugerencia de "${rule.triggerLabel}"?`}
			description="Dejará de mostrarse a los clientes. Esta acción no se puede deshacer."
		>
			<span class="icon-[lucide--trash-2] size-4"></span>
			Eliminar
		</ActionButton>
	</div>
</div>
