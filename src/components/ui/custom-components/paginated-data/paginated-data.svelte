<script lang="ts">
	// COMPONENTS
	import Button from '@/components/ui/button/button.svelte';
	import {
		Pagination,
		PaginationContent,
		PaginationItem
	} from '@/components/ui/pagination/index.js';

	// Prev/next arrows + "Page X / Y". Controlled: the parent owns `page` and the
	// keyset cursor map; this only renders the arrows + label and reports prev/next
	// clicks back up via callbacks.
	let {
		page,
		nextCursor,
		total,
		pageSize,
		loading = false,
		onPrev,
		onNext,
		class: className
	}: {
		/** 1-based page — owned by the parent. */
		page: number;
		/** Cursor for the next page from the latest fetch; null on the last page. */
		nextCursor: string | null | undefined;
		/** Total row count — enables the "Page X / Y" label. */
		total?: number | null;
		/** Rows per page from the latest fetch; defaults to 20. */
		pageSize?: number;
		/** Disables navigation while the requested page is loading. */
		loading?: boolean;
		onPrev: () => void;
		onNext: () => void;
		class?: string;
	} = $props();

	const hasPrevPage = $derived(!loading && page > 1);
	const totalPages = $derived(total != null && pageSize ? Math.ceil(total / pageSize) : undefined);
	const hasNextPage = $derived(
		!loading && nextCursor != null && (totalPages === undefined || page < totalPages)
	);
</script>

<Pagination count={Number.MAX_SAFE_INTEGER} class={className} aria-busy={loading}>
	<PaginationContent class="w-full">
		<span class="mr-auto text-sm text-muted-foreground">
			Page {page}{totalPages != null ? ` / ${totalPages}` : ''}
		</span>
		<PaginationItem>
			<Button
				variant="outline"
				size="icon"
				disabled={!hasPrevPage}
				onclick={onPrev}
				aria-label="Previous page"
			>
				<span class="icon-[lucide--chevron-left] size-4"></span>
			</Button>
		</PaginationItem>
		<PaginationItem>
			<Button
				variant="outline"
				size="icon"
				disabled={!hasNextPage}
				onclick={onNext}
				aria-label="Next page"
			>
				<span class="icon-[lucide--chevron-right] size-4"></span>
			</Button>
		</PaginationItem>
	</PaginationContent>
</Pagination>
