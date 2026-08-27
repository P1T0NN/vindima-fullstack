<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useMutation } from 'convex-svelte';
	import { ConvexError } from 'convex/values';
	import { isRateLimitError } from '@convex-dev/rate-limiter';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// UTILS
	import { toastMessage } from '@/utils/toastMessage';
import { hasErrorMessage } from '@/shared/utils/errorMessage';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	let { category }: { category: Doc<'productCategories'> } = $props();

	const deleteCategory = useMutation(
		api.tables.productCategories.mutations.deleteCategory.deleteCategory
	);

	let busy = $state(false);

	async function remove() {
		if (busy) return;
		busy = true;
		try {
			// Server refuses with CATEGORY_IN_USE while products still reference the slug.
			let result;
			try {
				result = await deleteCategory({ categoryId: category._id });
			} catch (error) {
				if (error instanceof ConvexError && hasErrorMessage(error.data)) {
					toastMessage({
						type: 'error',
						error,
						message: error.data.message
					});
				} else if (isRateLimitError(error)) {
					toastMessage({ type: 'error', error, message: '' });
				} else {
					throw error;
				}
				return;
			}
			const message = result.message;
			if (!result.success) {
				toastMessage({ type: 'error', error: null, message });
				return;
			}
			toastMessage({ type: 'success', message });
		} finally {
			busy = false;
		}
	}
</script>

<!-- Rendered inside the DataTable row cell on /admin/categories. -->
<div class="flex w-full items-start gap-3">
	<!-- Fixed-size thumb: rows stay aligned whether or not a category has an image, and the
	     placeholder doubles as the "this one has no image yet" signal for older categories. -->
	<div class="size-12 shrink-0 overflow-hidden rounded-md border bg-muted">
		{#if category.image}
			<img
				src={category.image}
				alt=""
				class="size-full object-cover"
				loading="lazy"
				decoding="async"
			/>
		{:else}
			<div class="flex size-full items-center justify-center text-muted-foreground">
				<span class="icon-[lucide--image] size-4" aria-hidden="true"></span>
			</div>
		{/if}
	</div>

	<div class="flex min-w-0 flex-1 items-start justify-between gap-3">
		<div class="min-w-0">
			<p class="truncate font-medium">{category.name}</p>

			{#if category.description}
				<p class="mt-0.5 line-clamp-2 text-sm text-muted-foreground">{category.description}</p>
			{/if}
		</div>

		<div class="flex shrink-0 items-center gap-1">
			<Button
				variant="outline"
				size="sm"
				href={appHref(ADMIN_PAGE_ENDPOINTS.EDIT_CATEGORY.replace(':id', category._id))}
				aria-label={`Editar ${category.name}`}
			>
				<span class="icon-[lucide--pencil] size-4"></span>
				Editar
			</Button>

			<ActionButton
				function={remove}
				variant="destructive"
				size="sm"
				isDestructive
				isPending={busy}
				title={`¿Eliminar ${category.name}?`}
				description="Esto no se puede deshacer."
			>
				<span class="icon-[lucide--trash-2] size-4"></span>
				Eliminar

				{#snippet body()}
					<ul class="flex flex-col gap-2.5 text-sm">
						<li class="flex items-start gap-2.5 text-foreground">
							<span class="mt-0.5 icon-[lucide--package] size-4 shrink-0 text-muted-foreground"
							></span>
							<span>
								Solo se pueden eliminar categorías vacías: si algún producto aún usa esta, la
								eliminación se rechaza y no cambia nada.
							</span>
						</li>
						<li class="flex items-start gap-2.5 text-foreground">
							<span class="mt-0.5 icon-[lucide--tag] size-4 shrink-0 text-muted-foreground"></span>
							<span>Desaparece del formulario de producto y de la agrupación en la tienda.</span>
						</li>
					</ul>
					<p class="mt-3 text-xs text-muted-foreground">
						No se eliminan productos. Para retirar una categoría en uso, mueve antes sus productos a
						otra categoría.
					</p>
				{/snippet}
			</ActionButton>
		</div>
	</div>
</div>
