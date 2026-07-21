<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import AdminRewardsHeader from '@/components/pages/(protected)/admin/rewards/admin-rewards-header.svelte';
	import AdminRewardsAddForm from '@/components/pages/(protected)/admin/rewards/admin-rewards-add-form.svelte';
	import AdminRewardsTable from '@/components/pages/(protected)/admin/rewards/admin-rewards-table.svelte';
</script>

<SvelteHead
	title="Recompensas"
	noindex
	description="Configura qué artículos pueden canjear los clientes con sus sellos de recompensa de Vindima."
/>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<AdminRewardsHeader />
	<AdminRewardsAddForm />
	<AdminRewardsTable />
</section>
