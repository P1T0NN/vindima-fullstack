<script lang="ts">
	// STATE
	import { authClass } from '@/features/auth/classes/authClass.svelte';

	// COMPONENTS
	import { Skeleton } from '@/components/ui/skeleton/index.js';

	const rewards = $derived(authClass.currentUser?.rewards ?? null);
	const loading = $derived(authClass.userLoading);
	const featureOn = $derived(!!rewards);

	const stampsPerReward = $derived(rewards?.stampsPerReward ?? 5);
	const stamps = $derived(rewards?.stamps ?? 0);
	const pending = $derived(rewards?.pendingStamps ?? 0);
	const remaining = $derived(Math.max(0, stampsPerReward - stamps));

	const dots = $derived(Array.from({ length: stampsPerReward }, (_, i) => i));

	/** Dot state: filled (earned), pending (in the return window), or empty. */
	function dotState(i: number): 'filled' | 'pending' | 'empty' {
		if (i < stamps) return 'filled';
		if (i < stamps + pending) return 'pending';
		return 'empty';
	}
</script>

{#if loading}
	<div class="border-b border-accent/10 px-8 py-9 sm:px-10">
		<Skeleton class="mb-5 h-4 w-56" />
		<Skeleton class="h-12 w-full" />
	</div>
{:else if featureOn}
	<div class="border-b border-accent/10 px-8 py-9 sm:px-10">
		<div class="mb-5 flex flex-wrap items-center justify-between gap-4">
			<p class="text-xs font-medium tracking-wide text-muted-foreground/80 uppercase">
				Your reward · {stamps} of {stampsPerReward} purchases
			</p>

			<p class="text-sm text-chart-2">
				{remaining} purchases to go
			</p>
		</div>

		<div class="flex items-center gap-4">
			{#each dots as i (i)}
				{@const state = dotState(i)}
				<span
					class={state === 'filled'
						? 'size-8 rounded-full bg-accent'
						: state === 'pending'
							? 'size-8 animate-pulse rounded-full border-2 border-dashed border-accent bg-accent/15'
							: 'size-8 rounded-full border-2 border-primary bg-transparent'}
					aria-hidden="true"
				></span>
			{/each}

			<span class="min-w-8 flex-1 border-t border-dashed border-primary/55" aria-hidden="true"
			></span>

			<span
				class="inline-flex size-12 items-center justify-center rounded-full border border-primary bg-primary/16"
				aria-hidden="true"
			>
				<svg
					width="24"
					height="24"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.4"
					class="text-chart-2"
				>
					<rect x="3.5" y="9" width="17" height="11.5" rx="1" />
					<path d="M3.5 13h17" />
					<path d="M12 9v11.5" />
					<path d="M12 9c-1.2-3.4-5.2-2.4-4.4.2.5 1.5 2.6 1.4 4.4-.2Z" />
					<path d="M12 9c1.2-3.4 5.2-2.4 4.4.2-.5 1.5-2.6 1.4-4.4-.2Z" />
				</svg>
			</span>
		</div>

		{#if pending > 0}
			<p class="mt-3 text-xs text-muted-foreground/70">
				{pending} on the way · confirms after delivery
			</p>
		{/if}
	</div>
{/if}
