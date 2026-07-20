<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';

	let { category }: { category: Doc<'productCategories'> } = $props();

	const convex = useConvexClient();

	let editing = $state(false);
	let draftName = $state('');
	let busy = $state(false);

	function startRename() {
		draftName = category.name;
		editing = true;
	}

	async function saveRename(event: SubmitEvent) {
		event.preventDefault();
		if (busy || !draftName.trim()) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.products.mutations.renameCategory.renameCategory,
				{ categoryId: category._id, name: draftName }
			);
			if (toastResult(res)) editing = false;
		} finally {
			busy = false;
		}
	}

	async function remove() {
		if (busy) return;
		busy = true;
		try {
			// Server refuses with CATEGORY_IN_USE while products still reference the slug.
			const res = await safeMutation(
				convex,
				api.tables.products.mutations.deleteCategory.deleteCategory,
				{ categoryId: category._id }
			);
			toastResult(res);
		} finally {
			busy = false;
		}
	}
</script>

<!-- Rendered inside a ConvexDataTable cell (see /admin/categories nameCell snippet). -->
<div class="flex w-full items-center justify-between gap-3">
	{#if editing}
		<form onsubmit={saveRename} class="flex flex-1 items-center gap-2">
			<Input bind:value={draftName} class="max-w-xs" required disabled={busy} />
			<Button type="submit" size="sm" disabled={busy || !draftName.trim()}>Save</Button>
			<Button type="button" variant="ghost" size="sm" onclick={() => (editing = false)}>
				Cancel
			</Button>
		</form>
	{:else}
		<span class="min-w-0 truncate font-medium">{category.name}</span>

		<div class="flex shrink-0 items-center gap-1">
			<Button
				type="button"
				variant="ghost"
				size="sm"
				onclick={startRename}
				disabled={busy}
				aria-label={`Rename ${category.name}`}
			>
				<PencilIcon class="size-4" />
				Rename
			</Button>
			<Button
				type="button"
				variant="ghost"
				size="sm"
				class="text-destructive hover:text-destructive"
				onclick={remove}
				disabled={busy}
				aria-label={`Delete ${category.name}`}
			>
				<Trash2Icon class="size-4" />
				Delete
			</Button>
		</div>
	{/if}
</div>
