<script lang="ts">
	// STATE
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';

	const stampsPerReward = $derived(authClass.currentUser?.rewards?.stampsPerReward ?? 5);
</script>

<div
	class="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-accent/10 bg-primary/12 px-5 py-4"
>
	<p class="text-sm leading-snug text-accent">
		Próxima recompensa:
		<strong class="font-semibold">un artículo gratis de tu elección</strong
		>{` cuando llegues a ${stampsPerReward} compras.`}
	</p>
	<Button
		href="/#shop"
		variant="outline"
		class="h-auto min-h-11 px-5 py-3 text-sm tracking-wider uppercase"
	>
		Sigue comprando
	</Button>
</div>
