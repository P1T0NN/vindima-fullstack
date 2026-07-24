<script lang="ts">
	// Curation framing, then the shopper's own choice named back to them.

	// CLASSES
	import { upsells } from '@/features/upsells/classes/upsells.svelte';
</script>

<div class="mb-5 pr-8">
	<p class="mb-2.5 text-[10.5px] font-medium tracking-[0.22em] text-chart-2 uppercase">
		La casa sugiere
	</p>
	<h2
		class="font-display text-[26px] leading-[1.08] font-semibold tracking-wide text-accent uppercase"
	>
		{#if upsells.addedName}
			Va perfecto con {upsells.addedName}
		{:else}
			Completa tu mesa
		{/if}
	</h2>
</div>
