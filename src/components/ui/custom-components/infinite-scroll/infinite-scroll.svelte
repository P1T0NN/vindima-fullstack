<script lang="ts">
	// COMPONENTS
	import { Spinner } from '@/components/ui/spinner/index.js';
	import { Button } from '@/components/ui/button/index.js';

	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';
	import type { Attachment } from 'svelte/attachments';

	type Props = {
		children?: Snippet;
		/** Load the next server-backed page. */
		loadMore: () => void;
		/** Retry the failed page request, when available. */
		retry?: () => void;
		/** Suppresses the bottom state while the first page is loading. */
		loading?: boolean;
		/** Whether a next-page request is currently in flight. */
		loadingMore?: boolean;
		/** Whether the server has another page available. */
		hasNextPage?: boolean;
		/** A request error; its details are intentionally not rendered directly. */
		error?: unknown;
		/** How far before the sentinel enters the viewport to request the next page. */
		rootMargin?: string;
		class?: string;
		errorLabel?: string;
		loadingLabel?: string;
		loadMoreLabel?: string;
		retryLabel?: string;
		endLabel?: string;
	};

	let {
		children,
		loadMore,
		retry,
		loading = false,
		loadingMore = false,
		hasNextPage = false,
		error,
		rootMargin = '0px 0px 640px 0px',
		class: className,
		errorLabel = 'Unable to load more items.',
		loadingLabel = 'Loading more items...',
		loadMoreLabel = 'Load more',
		retryLabel = 'Try again',
		endLabel = 'No more items.'
	}: Props = $props();

	const observeEnd: Attachment<HTMLElement> = (node) => {
		const Observer = globalThis.IntersectionObserver;
		if (!Observer) return;

		const observer = new Observer(
			(entries) => {
				if (!entries.some(({ isIntersecting }) => isIntersecting)) return;
				if (loading || loadingMore || !hasNextPage || error) return;

				loadMore();
			},
			{ rootMargin }
		);

		observer.observe(node);
		return () => observer.disconnect();
	};
</script>

<div
	class={cn('flex w-full flex-col items-center gap-2 py-4', className)}
	aria-busy={loading || loadingMore}
>
	{@render children?.()}

	{#if !loading}
		{#if error}
			<div class="flex flex-col items-center gap-2 text-center">
				<p class="text-sm text-destructive" role="alert">{errorLabel}</p>
				{#if retry}
					<Button variant="outline" size="sm" onclick={retry}>{retryLabel}</Button>
				{/if}
			</div>
		{:else if hasNextPage}
			<div class="h-px w-full" aria-hidden="true" {@attach observeEnd}></div>

			{#if loadingMore}
				<div
					class="flex items-center gap-2 text-sm text-muted-foreground"
					role="status"
					aria-live="polite"
				>
					<Spinner aria-hidden="true" />
					<span>{loadingLabel}</span>
				</div>
			{:else}
				<Button variant="outline" size="sm" onclick={loadMore}>{loadMoreLabel}</Button>
			{/if}
		{:else if endLabel}
			<p class="text-sm text-muted-foreground" role="status" aria-live="polite">{endLabel}</p>
		{/if}
	{/if}
</div>
