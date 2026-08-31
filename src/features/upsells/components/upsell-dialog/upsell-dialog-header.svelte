<script lang="ts">
	// Curation framing, then the shopper's own choice named back to them.

	// CLASSES
	import { upsells } from '@/features/upsells/classes/upsells.svelte';
</script>

<div class="mb-5 pr-9">
	<p class="mb-2.5 text-[10.5px] font-medium tracking-[0.22em] text-gold-ink uppercase">
		La casa sugiere
	</p>
	<h2
		class="font-display text-2xl leading-[1.08] font-semibold tracking-wide text-accent uppercase sm:text-[26px]"
	>
		{#if upsells.addedName}
			Va perfecto con {upsells.addedName}
		{:else}
			Completa tu mesa
		{/if}
	</h2>
</div>
