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

	// LUCIDE ICONS
	import PlusIcon from '@lucide/svelte/icons/plus';

	const convex = useConvexClient();
	const id = $props.id();

	let name = $state('');
	let busy = $state(false);

	async function add(event: SubmitEvent) {
		event.preventDefault();
		if (busy || !name.trim()) return;
		busy = true;
		try {
			const res = await safeMutation(
				convex,
				api.tables.products.mutations.createCategory.createCategory,
				{ name }
			);
			if (toastResult(res)) name = '';
		} finally {
			busy = false;
		}
	}
</script>

<form onsubmit={add} class="flex items-end gap-3">
	<div class="flex max-w-xs flex-1 flex-col gap-1.5">
		<label for="category-name-{id}" class="text-sm font-medium">Category name</label>
		<Input
			id="category-name-{id}"
			bind:value={name}
			placeholder="e.g. Cheese Boards"
			required
			disabled={busy}
		/>
	</div>
	<Button type="submit" disabled={busy || !name.trim()}>
		<PlusIcon class="size-4" />
		Add category
	</Button>
</form>
