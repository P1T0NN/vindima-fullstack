<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	// LUCIDE ICONS
	import PencilIcon from '@lucide/svelte/icons/pencil';
	import Trash2Icon from '@lucide/svelte/icons/trash-2';
	import PackageIcon from '@lucide/svelte/icons/package';
	import TagIcon from '@lucide/svelte/icons/tag';

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
				api.tables.productCategories.mutations.renameCategory.renameCategory,
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
				api.tables.productCategories.mutations.deleteCategory.deleteCategory,
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
			<Button type="submit" size="sm" disabled={busy || !draftName.trim()}>Guardar</Button>
			<Button type="button" variant="ghost" size="sm" onclick={() => (editing = false)}>
				Cancelar
			</Button>
		</form>
	{:else}
		<span class="min-w-0 truncate font-medium">{category.name}</span>

		<div class="flex shrink-0 items-center gap-1">
			<Button
				type="button"
				variant="outline"
				size="sm"
				onclick={startRename}
				disabled={busy}
				aria-label={`Renombrar ${category.name}`}
			>
				<PencilIcon class="size-4" />
				Renombrar
			</Button>

			<ActionButton
				function={remove}
				variant="ghost"
				size="sm"
				class="text-destructive hover:text-destructive"
				isDestructive
				isPending={busy}
				title={`¿Eliminar ${category.name}?`}
				description="Esto no se puede deshacer."
			>
				<Trash2Icon class="size-4" />
				Eliminar

				{#snippet body()}
					<ul class="flex flex-col gap-2.5 text-sm">
						<li class="flex items-start gap-2.5 text-foreground">
							<PackageIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
							<span>
								Solo se pueden eliminar categorías vacías — si algún producto aún usa esta, la
								eliminación se rechaza y no cambia nada.
							</span>
						</li>
						<li class="flex items-start gap-2.5 text-foreground">
							<TagIcon class="mt-0.5 size-4 shrink-0 text-muted-foreground" />
							<span>Desaparece del formulario de producto y de la agrupación en la tienda.</span>
						</li>
					</ul>
					<p class="mt-3 text-xs text-muted-foreground">
						No se eliminan productos. Para retirar una categoría en uso, mueve antes sus productos
						a otra categoría.
					</p>
				{/snippet}
			</ActionButton>
		</div>
	{/if}
</div>
