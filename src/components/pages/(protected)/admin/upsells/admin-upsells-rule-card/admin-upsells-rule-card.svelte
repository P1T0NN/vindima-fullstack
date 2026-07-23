<script lang="ts">
	// One rule as a readable sentence with thumbnails (§8.1). Problems are badges, not breakage:
	// dead items/triggers get a ⚠ but the rule keeps working with its healthy items.

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Switch } from '@/components/ui/switch/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { UpsellAdminRule } from '@/shared/features/upsells/types/upsellsTypes';

	// LUCIDE ICONS
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import TriangleAlertIcon from '@lucide/svelte/icons/triangle-alert';

	let { rule, onedit }: { rule: UpsellAdminRule; onedit: (rule: UpsellAdminRule) => void } =
		$props();

	const convex = useConvexClient();
	let togglePending = $state(false);
	let deletePending = $state(false);

	// How many offered items no longer resolve — surfaced as one warning line, not breakage.
	const brokenItems = $derived(rule.items.filter((i) => i.status !== 'ok').length);
	const triggerBroken = $derived(rule.triggerStatus === 'missing');

	async function toggle(next: boolean) {
		if (togglePending) return;
		togglePending = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.upsells.mutations.setUpsellRuleEnabled.setUpsellRuleEnabled,
				{ ruleId: rule.id as never, enabled: next }
			);
			toastResult(res);
		} finally {
			togglePending = false;
		}
	}

	async function remove() {
		if (deletePending) return;
		deletePending = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.upsells.mutations.deleteUpsellRule.deleteUpsellRule,
				{ ruleId: rule.id as never }
			);
			toastResult(res);
		} finally {
			deletePending = false;
		}
	}
</script>

<div class={cn('flex flex-col gap-3 rounded-lg border border-border p-4', !rule.enabled && 'opacity-70')}>
	<div class="flex items-start justify-between gap-3">
		<!-- The trigger, as prose. -->
		<p class="text-sm leading-relaxed">
			<span class="text-muted-foreground">Cuando se agrega</span>
			{#if rule.trigger.kind === 'product'}
				<span class="font-medium">{rule.triggerLabel}</span>
			{:else if rule.trigger.kind === 'category'}
				<span class="text-muted-foreground">cualquier producto de</span>
				<span class="font-medium">«{rule.triggerLabel}»</span>
			{:else}
				<span class="font-medium">cualquier producto</span>
				<span class="text-muted-foreground">(regla general)</span>
			{/if}
			{#if triggerBroken}
				<span class="ml-1 inline-flex items-center gap-1 text-xs text-destructive">
					<TriangleAlertIcon class="size-3.5" /> ya no existe
				</span>
			{/if}
		</p>

		<Switch
			checked={rule.enabled}
			disabled={togglePending}
			onCheckedChange={toggle}
			aria-label={rule.enabled ? 'Desactivar sugerencia' : 'Activar sugerencia'}
		/>
	</div>

	<!-- Offered items, in fire order. -->
	<div class="flex flex-wrap items-center gap-2">
		<span class="text-xs text-muted-foreground">sugerir:</span>
		{#each rule.items as item (item.ref)}
			{@const dead = item.status !== 'ok'}
			<span
				class={cn(
					'inline-flex items-center gap-1.5 rounded-md border border-border py-1 pr-2 pl-1 text-xs',
					dead && 'text-muted-foreground line-through opacity-70'
				)}
				title={item.status === 'missing'
					? 'Ya no existe'
					: item.status === 'unavailable'
						? 'No disponible'
						: item.name}
			>
				<span class="size-6 shrink-0 overflow-hidden rounded bg-muted">
					{#if item.imageUrl}
						<img src={item.imageUrl} alt="" class="size-full object-cover" />
					{/if}
				</span>
				<span class="max-w-40 truncate">{item.name}</span>
			</span>
		{/each}
	</div>

	{#if brokenItems > 0}
		<p class="inline-flex items-center gap-1 text-xs text-destructive">
			<TriangleAlertIcon class="size-3.5" />
			{brokenItems === 1
				? '1 artículo ya no está disponible'
				: `${brokenItems} artículos ya no están disponibles`} — edítalo para corregirlo.
		</p>
	{/if}

	<div class="flex items-center justify-end gap-2">
		<Button variant="outline" size="sm" onclick={() => onedit(rule)}>
			<PencilIcon class="size-3.5" />
			Editar
		</Button>
		<ActionButton
			function={remove}
			variant="ghost"
			size="sm"
			class="text-destructive hover:text-destructive"
			isDestructive
			isPending={deletePending}
			title="¿Eliminar esta sugerencia?"
			description="Dejará de mostrarse a los clientes. Esta acción no se puede deshacer."
		>
			<Trash2Icon class="size-4" />
			Eliminar
		</ActionButton>
	</div>
</div>
