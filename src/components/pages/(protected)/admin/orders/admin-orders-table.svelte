<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQueryState, parseAsStringLiteral } from 'nuqs-svelte';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';
	import { PAGINATION_DATA } from '@/shared/features/pagination/config.js';
	import { SEARCH_DATA } from '@/shared/features/search/config.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import { TableCell, TableHead } from '@/components/ui/table';

	// DATA
	import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/shared/features/orders/data/ordersData.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { orderStatusLabel, orderStatusBadgeClass } from '@/features/orders/utils/orderStatus.js';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';

	type OrderRow = Doc<'orders'>;

	// Status filter is URL-synced (`?status=`): null = all. Bookmarkable/shareable filtered
	// views and back-button support come for free, and the dashboard's order alert cards
	// deep-link here by setting the param.
	const status = useQueryState('status', parseAsStringLiteral(ORDER_STATUSES));
	const statusOptions = [
		{ value: '', label: 'Estado: todos' },
		...ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] }))
	];

	const search = useSearch({
		minChars: SEARCH_DATA.MIN_QUERY_LENGTH,
		debounceMs: SEARCH_DATA.INPUT_DEBOUNCE_MS
	});
	const orders = useConvexPagination(
		api.tables.orders.queries.fetchOrders.fetchOrders,
		() => ({
			search: search.term || undefined,
			status: status.current ?? undefined
		}),
		{ pageSize: PAGINATION_DATA.DEFAULT_PAGE_SIZE }
	);
</script>

<DataTable pagination={orders} placement="above" class="text-sm" key={(order) => order._id}>
	{#snippet header()}
		<div class="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
			<SearchInput
				class="md:max-w-sm"
				placeholder="Buscar por número o cliente..."
				label="Buscar pedidos"
				bind:value={search.value}
			/>
			<select
				class="h-9 w-full rounded-md border border-input bg-background px-3 text-sm md:w-48"
				aria-label="Filtrar por estado"
				bind:value={
					() => status.current ?? '',
					(value) => (status.current = value ? (value as (typeof ORDER_STATUSES)[number]) : null)
				}
			>
				{#each statusOptions as option (option.value)}
					<option value={option.value}>{option.label}</option>
				{/each}
			</select>
		</div>
	{/snippet}

	{#snippet head()}
		<TableHead>Pedido</TableHead>
		<TableHead class="hidden md:table-cell">Fecha</TableHead>
		<TableHead class="hidden md:table-cell">Cliente</TableHead>
		<TableHead class="hidden lg:table-cell">Artículos</TableHead>
		<TableHead>Total</TableHead>
		<TableHead>Estado</TableHead>
	{/snippet}

	{#snippet row(order: OrderRow)}
		<TableCell>
			<Button
				variant="link"
				href={appHref(ADMIN_PAGE_ENDPOINTS.ORDER.replace(':id', order._id))}
				class="h-auto justify-start p-0 text-left font-medium text-accent"
			>
				{order.number}
			</Button>
		</TableCell>
		<TableCell class="hidden md:table-cell">
			{new Date(order._creationTime).toLocaleDateString()}
		</TableCell>
		<TableCell class="hidden md:table-cell">{order.name || order.email}</TableCell>
		<TableCell class="hidden lg:table-cell">
			{order.lines.reduce((n, line) => n + line.qty, 0)}
		</TableCell>
		<TableCell class="tabular-nums">
			{formatMoneyMinor(order.amounts.totalMinor, order.currency)}
		</TableCell>
		<TableCell>
			<span
				class={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${orderStatusBadgeClass(order.status)}`}
			>
				{orderStatusLabel(order.status)}
			</span>
		</TableCell>
	{/snippet}

	{#snippet errorSnippet()}
		<p
			class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
		>
			No se pudieron cargar los pedidos.
		</p>
	{/snippet}

	{#snippet empty()}
		<p class="rounded-xl border bg-card p-8 text-center text-sm text-muted-foreground">
			No hay pedidos que coincidan con los filtros.
		</p>
	{/snippet}
</DataTable>
