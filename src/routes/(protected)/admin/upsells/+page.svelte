<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQuery } from 'convex-svelte';

	// COMPONENTS
	import CreateUpsellButton from '@/components/pages/(protected)/admin/upsells/create-upsell-button.svelte';
	import { ErrorComponent } from '@/components/ui/custom-components/error-component/index.js';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import AdminUpsellsHeader from '@/components/pages/(protected)/admin/upsells/admin-upsells-header.svelte';
	import AdminUpsellCard from '@/components/pages/(protected)/admin/upsells/admin-upsell-card/admin-upsell-card.svelte';
	import AdminUpsellsCustomizeDialog from '@/components/pages/(protected)/admin/upsells/admin-upsells-customize-dialog/admin-upsells-customize-dialog.svelte';
	import AdminUpsellsEmpty from '@/components/pages/(protected)/admin/upsells/empty/admin-upsells-empty.svelte';
	import AdminUpsellsLoading from '@/components/pages/(protected)/admin/upsells/loading/admin-upsells-loading.svelte';

	// UTILS
	import { buildTriggerKey } from '@/shared/features/upsells/utils/upsellsUtils';

	// TYPES
	import type { UpsellAdminRule } from '@/shared/features/upsells/types/upsellsTypes';

	const rulesQuery = useQuery(api.tables.upsells.queries.fetchUpsellRules.fetchUpsellRules, {});
	const rules = $derived((rulesQuery.data?.rules ?? []) as UpsellAdminRule[]);
	const existingKeys = $derived(rules.map((r) => buildTriggerKey(r.trigger)));

	let customizeDialog: AdminUpsellsCustomizeDialog;

	function openCreate() {
		customizeDialog.open(null);
	}

	function openEdit(rule: UpsellAdminRule) {
		customizeDialog.open(rule);
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
			<CreateUpsellButton onOpen={openCreate} />
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
		<AdminUpsellsEmpty onOpen={openCreate} />
	{:else}
		<div class="flex flex-col gap-3">
			{#each rules as rule (rule.id)}
				<AdminUpsellCard {rule} onEdit={openEdit} />
			{/each}
		</div>
	{/if}
</section>

<AdminUpsellsCustomizeDialog bind:this={customizeDialog} {existingKeys} />
