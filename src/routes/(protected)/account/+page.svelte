<script lang="ts">
	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import AccountClubCard from '@/components/pages/(protected)/account/account-club-card/account-club-card.svelte';
	import AccountSessionCard from '@/components/pages/(protected)/account/account-session-card.svelte';
</script>

<SvelteHead
	title="Mi cuenta"
	noindex
	description="Administra tu membresía del club Vindima, tus recompensas y tu historial de compras."
/>

<Section yPadding="none" class="min-h-[calc(100dvh-3.5rem)] bg-secondary py-16 pb-24 sm:pb-28">
	<div class="flex flex-col gap-6">
		<AccountClubCard />
		<AccountSessionCard />
	</div>
</Section>
