<script lang="ts">
	// COMPONENTS
	import { buttonVariants } from '@/components/ui/button/index.js';
	import ChevronLeftIcon from '@lucide/svelte/icons/chevron-left';
	import ChevronRightIcon from '@lucide/svelte/icons/chevron-right';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { pageWindow } from './paginatedDataUtils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	type Props = {
		class?: string;
		/** 1-based page; use `bind:page` from parent. In `href` mode this is read-only. */
		page?: number;
		/**
		 * Total pages when known (offset mode). Leave `undefined` for cursor mode — the label
		 * collapses to "Página X", page numbers are suppressed (there is no last page to link),
		 * and `canGoNext` must be supplied explicitly so the next-button can disable on `isDone`.
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
		/**
		 * URL mode. Given a target page, return its address. Renders real `<a href>` links
		 * instead of buttons, so pages are crawlable, middle-clickable, and reachable with
		 * JavaScript disabled. The component never writes `page` in this mode; the route
		 * loader owns it.
		 *
		 * NOTE: this project has no URL-driven list helpers yet (`listHref` et al. are not
		 * ported) — see `docs/GeneralSystemDesignRule.md § LIST & PAGINATION MECHANISMS`.
		 * The prop is here so the component is ready the day one is needed.
		 */
		href?: (page: number) => string;
		/** Render page numbers. Defaults to on in `href` mode, off otherwise. Needs `totalPages`. */
		numbered?: boolean;
		/** Neighbours shown either side of the current page. See `pageWindow`. */
		span?: number;
	};

	let {
		class: className,
		page = $bindable(1),
		totalPages,
		canGoNext: canGoNextProp,
		isLoading,
		queryLoading,
		hasResult,
		href,
		numbered,
		span = 1
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

	const canGoPrev = $derived(page > 1);

	/** No total means no last page, so there is nothing to number against. */
	const showNumbers = $derived((numbered ?? href !== undefined) && totalPages !== undefined);

	const slots = $derived(showNumbers ? pageWindow(page, totalPages!, span) : []);

	const controlClass = cn(buttonVariants({ variant: 'outline', size: 'icon' }), 'rounded-full');
	const disabledClass = 'pointer-events-none opacity-50';
</script>

{#snippet control(
	target: number,
	disabled: boolean,
	label: string,
	rel: 'prev' | 'next' | undefined,
	current: boolean,
	klass: string,
	body: Snippet
)}
	{#if href && !disabled}
		<a
			href={href(target)}
			aria-label={label}
			aria-current={current ? 'page' : undefined}
			{rel}
			class={klass}
		>
			{@render body()}
		</a>
	{:else if href}
		<!-- A disabled control must not be a link: no href beats an href that goes nowhere. -->
		<span aria-label={label} aria-disabled="true" class={cn(klass, disabledClass)}>
			{@render body()}
		</span>
	{:else}
		<button
			type="button"
			aria-label={label}
			aria-current={current ? 'page' : undefined}
			{disabled}
			class={klass}
			onclick={() => {
				page = target;
			}}
		>
			{@render body()}
		</button>
	{/if}
{/snippet}

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
			<span class="inline-block min-w-[8ch]" aria-busy="true">...</span>
		{:else if totalPages !== undefined}
			{`Página ${page} de ${totalPages}`}
		{:else}
			{`Página ${page}`}
		{/if}
	</span>

	<div class="flex items-center gap-1.5">
		{@render control(
			Math.max(1, page - 1),
			!canGoPrev || isLoading,
			'Ir a la página anterior',
			'prev',
			false,
			controlClass,
			prevIcon
		)}

		{#each slots as slot, i (slot === 'gap' ? `gap-${i}` : slot)}
			{#if slot === 'gap'}
				<span class="px-1 text-sm text-muted-foreground" aria-hidden="true">...</span>
			{:else}
				{@render control(
					slot,
					isLoading,
					`Ir a la página ${slot}`,
					undefined,
					slot === page,
					cn(
						buttonVariants({ variant: slot === page ? 'default' : 'outline', size: 'icon' }),
						'rounded-full tabular-nums'
					),
					pageLabel
				)}
				{#snippet pageLabel()}{slot}{/snippet}
			{/if}
		{/each}

		{@render control(
			totalPages !== undefined ? Math.min(totalPages, page + 1) : page + 1,
			!canGoNext || isLoading,
			'Ir a la página siguiente',
			'next',
			false,
			controlClass,
			nextIcon
		)}
	</div>
</nav>

{#snippet prevIcon()}<ChevronLeftIcon class="size-4" />{/snippet}
{#snippet nextIcon()}<ChevronRightIcon class="size-4" />{/snippet}
