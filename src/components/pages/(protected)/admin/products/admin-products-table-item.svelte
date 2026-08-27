<script lang="ts">
	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import Button from '@/components/ui/button/button.svelte';
	import { TableCell } from '@/components/ui/table';

	// DATA / UTILS
	import { productStatusLabel } from '@/features/products/utils/productStatus.js';
	import { priceRange } from '@/shared/utils/priceRange.js';
	import { appHref } from '@/utils/app-navigation.js';

	// TYPES
	import type { AdminProductRow } from '@/shared/features/products/types/productsTypes.js';

	interface Props {
		product: AdminProductRow;
		categoryNames: ReadonlyMap<string, string>;
	}

	let { product, categoryNames }: Props = $props();

	const editProductHref = () =>
		appHref(ADMIN_PAGE_ENDPOINTS.EDIT_PRODUCT.replace(':id', product._id));
</script>

<TableCell>
	<Button
		variant="link"
		href={editProductHref()}
		class="h-auto justify-start gap-2 p-0 text-left font-normal"
	>
		<span class="grid size-8 shrink-0 place-items-center overflow-hidden rounded-md bg-muted">
			{#if product.images[0]}
				<img
					src={product.images[0]}
					alt={product.name}
					class="size-full object-cover"
					loading="lazy"
					decoding="async"
				/>
			{:else}
				<span class="text-xs font-semibold text-muted-foreground">
					{product.name.slice(0, 1).toUpperCase()}
				</span>
			{/if}
		</span>
		<span class="font-medium">{product.name}</span>
	</Button>
</TableCell>

<TableCell class="hidden md:table-cell">
	{categoryNames.get(product.category) ?? product.category}
</TableCell>

<TableCell>
	<span
		class={product.status === 'active'
			? 'inline-flex rounded-sm bg-chart-2/15 px-2 py-0.5 text-xs font-medium text-gold-ink'
			: product.status === 'archived'
				? 'inline-flex rounded-sm bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive'
				: 'inline-flex rounded-sm bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground'}
	>
		{productStatusLabel(product.status)}
	</span>
</TableCell>

<TableCell class="hidden text-right tabular-nums md:table-cell">
	{product.variants.length}
</TableCell>

<TableCell class="hidden text-right tabular-nums sm:table-cell">
	{priceRange(product.variants)}
</TableCell>

<TableCell class="text-right">
	<Button
		variant="outline"
		size="sm"
		href={editProductHref()}
		aria-label={`Editar ${product.name}`}
	>
		<span class="icon-[lucide--pencil] size-4" aria-hidden="true"></span>
		<span class="sr-only sm:not-sr-only">Editar</span>
	</Button>
</TableCell>
