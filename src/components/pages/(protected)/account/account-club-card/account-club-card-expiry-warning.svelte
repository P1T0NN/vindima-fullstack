<script lang="ts">
	// STATE
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// UTILS
	import { expiryWarning } from '@/shared/features/rewards/utils/rewardsUtils';

	// Computed against the viewer's clock at render time (the server can't re-run on wall-clock).
	const expiry = $derived.by(() => {
		const lastActivityAt = authClass.currentUser?.rewards?.lastActivityAt;
		return lastActivityAt ? expiryWarning(lastActivityAt, Date.now()) : null;
	});

	function formatDate(ms: number): string {
		return new Intl.DateTimeFormat(undefined, {
			day: 'numeric',
			month: 'short',
			year: 'numeric'
		}).format(new Date(ms));
	}
</script>

{#if expiry}
	<div class="border-b border-accent/10 bg-destructive/8 px-8 py-3.5 sm:px-10">
		<p class="text-sm text-destructive">
			Tus recompensas expiran el {formatDate(expiry.expiresAt)}. Sigue comprando para conservarlas.
		</p>
	</div>
{/if}
