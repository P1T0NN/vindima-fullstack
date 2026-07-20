<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { buttonVariants } from '@/components/ui/button/index.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// UTILS
	import { cn } from '@/utils/utils.js';

	type Props = {
		class?: string;
		/** 1-based page; use `bind:page` from parent. */
		page?: number;
		/**
		 * Total pages when known (offset mode). Leave `undefined` for cursor mode — the label
		 * collapses to "Page X" and `canGoNext` must be supplied explicitly so the next-button
		 * can disable on `isDone`.
		 */
		totalPages?: number;
		/**
		 * Cursor-mode opt-in: parent computes `!isDone && hasResult` and passes it in. When
		 * `totalPages` is set this is ignored — offset mode derives next-availability from
		 * `page < totalPages`.
		 */
		canGoNext?: boolean;
		/** Full-table / route loading (skeleton, ellipsis). */
		isLoading: boolean;
		/** Query in flight (e.g. Convex `useQuery` `isLoading`). */
		queryLoading: boolean;
		/** Current subscription has a result object (not a brief `undefined` between arg changes). */
		hasResult: boolean;
	};

	let {
		class: className,
		page = $bindable(1),
		totalPages,
		canGoNext: canGoNextProp,
		isLoading,
		queryLoading,
		hasResult
	}: Props = $props();

	/**
	 * Offset mode: known total bounds the next button. Cursor mode: parent threads in
	 * `!isDone` via `canGoNext` and we still gate on `queryLoading`/`hasResult` for parity.
	 */
	const canGoNext = $derived(
		totalPages !== undefined
			? page < totalPages && !queryLoading && hasResult
			: (canGoNextProp ?? false) && !queryLoading && hasResult
	);
</script>

<!--
  No Bits `Pagination.Root`: it `bind:`s `page` and clamps from its own `count`/`perPage`,
  which fights one-off page updates and can reset the parent to page 1.
-->
<nav
	aria-label="paginación"
	data-slot="paginated-data"
	class={cn('flex w-full items-center justify-between gap-2', className)}
>
	<span class="text-sm text-muted-foreground tabular-nums">
		{#if isLoading}
			<span class="inline-block min-w-[8ch]" aria-busy="true">…</span>
		{:else if totalPages !== undefined}
			{`Página ${page} de ${totalPages}`}
		{:else}
			{`Página ${page}`}
		{/if}
	</span>

	<div class="flex items-center gap-1.5">
		<button
			type="button"
			aria-label="Ir a la página anterior"
			class={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full')}
			disabled={page <= 1 || isLoading}
			onclick={() => {
				page = Math.max(1, page - 1);
			}}
		>
			<ChevronLeftIcon class="size-4" />
		</button>

		<button
			type="button"
			aria-label="Ir a la página siguiente"
			class={cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full')}
			disabled={!canGoNext || isLoading}
			onclick={() => {
				/** Cursor mode has no upper bound to clamp against — `canGoNext` already gates `isDone`. */
				page = totalPages !== undefined ? Math.min(totalPages, page + 1) : page + 1;
			}}
		>
			<ChevronRightIcon class="size-4" />
		</button>
	</div>
</nav>
