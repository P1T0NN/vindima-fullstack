<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQueryState, parseAsStringLiteral } from 'nuqs-svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import { NativeSelect } from '@/components/ui/select/index.js';

	// DATA
	import { ORDER_STATUSES, ORDER_STATUS_LABELS } from '@/shared/features/orders/data/ordersData.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';
	import { formatMoneyMinor } from '@/utils/formatters.js';
	import { orderStatusLabel, orderStatusBadgeClass } from '@/features/orders/utils/orderStatus.js';

	// TYPES
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';
	import type { Doc } from '@/convex/_generated/dataModel';

	type OrderRow = Doc<'orders'>;

	const columns: ColumnDef<OrderRow>[] = [
		{ id: 'number', header: 'Pedido', accessor: (r) => r.number },
		{
			id: 'date',
			header: 'Fecha',
			accessor: (r) => new Date(r._creationTime).toLocaleDateString(),
			hideBelow: 'md'
		},
		{ id: 'customer', header: 'Cliente', accessor: (r) => r.name || r.email, hideBelow: 'md' },
		{
			id: 'items',
			header: 'Artículos',
			accessor: (r) => r.lines.reduce((n, line) => n + line.qty, 0),
			hideBelow: 'lg'
		},
		{
			id: 'total',
			header: 'Total',
			accessor: (r) => formatMoneyMinor(r.amounts.totalMinor, r.currency),
			cellClass: 'tabular-nums'
		},
		{ id: 'status', header: 'Estado', accessor: (r) => orderStatusLabel(r.status) }
	];

	// Status filter is URL-synced (`?status=`): null = all. Bookmarkable/shareable filtered
	// views and back-button support come for free, and the dashboard's order alert cards
	// deep-link here by setting the param.
	const status = useQueryState('status', parseAsStringLiteral(ORDER_STATUSES));
	const statusOptions = [
		{ value: '', label: 'Estado: todos' },
		...ORDER_STATUSES.map((value) => ({ value, label: ORDER_STATUS_LABELS[value] }))
	];
</script>

<ConvexDataTable
	caption="Pedidos"
	query={api.tables.orders.queries.fetchOrders.fetchOrders}
	queryArgs={{ status: status.current ?? undefined }}
	controlsPlace="top"
	searchable
	searchPlaceholder="Buscar por número o cliente…"
	{columns}
	getRowId={(r) => r._id}
	customCells={{ number: numberCell, status: statusCell }}
	{filters}
/>

{#snippet filters()}
	<NativeSelect
		class="w-full md:w-48"
		ariaLabel="Filtrar por estado"
		bind:value={
			// `ORDER_STATUSES`, not `OrderRow['status']` — the latter also carries `draft`, which is
			// not a filterable state (an unpaid online order is not an order yet).
			() => status.current ?? '',
			(v) => (status.current = v ? (v as (typeof ORDER_STATUSES)[number]) : null)
		}
		options={statusOptions}
	/>
{/snippet}

{#snippet numberCell({ row }: DataTableCellSnippetProps<OrderRow>)}
	<a
		href={appHref(ADMIN_PAGE_ENDPOINTS.ORDER.replace(':id', row._id))}
		class="font-medium text-accent hover:underline"
	>
		{row.number}
	</a>
{/snippet}

{#snippet statusCell({ row }: DataTableCellSnippetProps<OrderRow>)}
	<span
		class={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${orderStatusBadgeClass(row.status)}`}
	>
		{orderStatusLabel(row.status)}
	</span>
{/snippet}
