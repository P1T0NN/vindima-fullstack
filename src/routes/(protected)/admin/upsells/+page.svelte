<script lang="ts">
	// The /admin/upsells page — ONE subscription (`fetchUpsellRules`, display + mutation share
	// the screen), the rule list, and the create/edit dialog. See UpsellsSystemDesign.md §8.

	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from '@mmailaender/convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { ErrorComponent } from '@/components/ui/error-component/index.js';
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminUpsellsHeader from '@/components/pages/(protected)/admin/upsells/admin-upsells-header.svelte';
	import AdminUpsellsRuleCard from '@/components/pages/(protected)/admin/upsells/admin-upsells-rule-card/admin-upsells-rule-card.svelte';
	import AdminUpsellsCustomizeDialog from '@/components/pages/(protected)/admin/upsells/admin-upsells-customize-dialog/admin-upsells-customize-dialog.svelte';
	import AdminUpsellsEmpty from '@/components/pages/(protected)/admin/upsells/empty/admin-upsells-empty.svelte';
	import AdminUpsellsLoading from '@/components/pages/(protected)/admin/upsells/loading/admin-upsells-loading.svelte';

	// UTILS
	import { buildTriggerKey } from '@/shared/features/upsells/utils/upsellsUtils';

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';

	// TYPES
	import type { UpsellAdminRule } from '@/shared/features/upsells/types/upsellsTypes';

	const rulesQuery = useQuery(api.tables.upsells.queries.fetchUpsellRules.fetchUpsellRules, {});
	const rules = $derived((rulesQuery.data?.rules ?? []) as UpsellAdminRule[]);
	const existingKeys = $derived(rules.map((r) => buildTriggerKey(r.trigger)));

	let builderOpen = $state(false);
	let editingRule = $state<UpsellAdminRule | null>(null);

	function create() {
		editingRule = null;
		builderOpen = true;
	}
	function edit(rule: UpsellAdminRule) {
		editingRule = rule;
		builderOpen = true;
	}
</script>

<SvelteHead
	title="Sugerencias"
	noindex
	description="Configura qué productos se sugieren al cliente cuando agrega algo al carrito."
/>

<section class="flex w-full flex-col gap-5 p-4 md:p-6">
	<div class="flex items-start justify-between gap-4">
		<AdminUpsellsHeader />
		
		{#if rules.length > 0}
			<Button onclick={create} class="shrink-0">
				<PlusIcon class="size-4" />
				Nueva sugerencia
			</Button>
		{/if}
	</div>

	{#if rulesQuery.error}
		<ErrorComponent
			variant="alert"
			title="No se pudieron cargar las sugerencias"
			description="Algo salió mal. Inténtalo de nuevo."
		/>
	{:else if rulesQuery.isLoading}
		<AdminUpsellsLoading />
	{:else if rules.length === 0}
		<AdminUpsellsEmpty oncreate={create} />
	{:else}
		<div class="flex flex-col gap-3">
			{#each rules as rule (rule.id)}
				<AdminUpsellsRuleCard {rule} onedit={edit} />
			{/each}
		</div>
	{/if}
</section>

<!-- Always mounted so the close animation runs; `open` gates visibility. -->
<AdminUpsellsCustomizeDialog bind:open={builderOpen} rule={editingRule} {existingKeys} />
