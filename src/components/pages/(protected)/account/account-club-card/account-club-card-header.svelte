<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';

	// STATE
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// Live user, with the SSR snapshot as the first-paint fallback (same pattern as checkout).
	const customerName = $derived(authClass.currentUser?.name ?? page.data.currentUser?.name ?? '');

	// The "Active Club" badge shows only when the rewards feature is on for this user.
	const featureOn = $derived(!!authClass.currentUser?.rewards);
</script>

<div class="flex flex-wrap items-center justify-between gap-5 bg-accent px-8 py-8 sm:px-10">
	<div>
		<p class="mb-2.5 text-xs font-medium tracking-wide text-primary uppercase">My account</p>
		<h1
			class="font-display text-4xl leading-none font-semibold tracking-wide text-background uppercase"
		>
			Hello, {customerName}
		</h1>
	</div>

	{#if featureOn}
		<span
			class="inline-flex items-center gap-2 rounded-sm bg-primary px-4 py-2.5 text-xs font-semibold tracking-wide text-primary-foreground uppercase"
		>
			<span class="size-2 rounded-full bg-accent" aria-hidden="true"></span>
			Active Club
		</span>
	{/if}
</div>
