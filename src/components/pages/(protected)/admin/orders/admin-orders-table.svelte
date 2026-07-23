<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useQueryState, parseAsStringLiteral } from 'nuqs-svelte';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import AdminOrderRefundButton from './admin-order-refund-button.svelte';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '@/components/ui/select/index.js';

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
			accessor: (r) => formatMoneyMinor(r.amounts.totalMinor, r.currency)
		},
		{ id: 'status', header: 'Estado', accessor: (r) => orderStatusLabel(r.status) },
		{ id: 'actions', header: '', accessor: () => '', wrap: true }
	];

	// Status filter is URL-synced (`?status=`): null = all. Bookmarkable/shareable filtered
	// views and back-button support come for free, and the dashboard's order alert cards
	// deep-link here by setting the param.
	const status = useQueryState('status', parseAsStringLiteral(ORDER_STATUSES));
	const statusTriggerLabel = $derived(
		status.current ? orderStatusLabel(status.current) : 'Estado: todos'
	);
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
	customCells={{ number: numberCell, status: statusCell, actions: actionsCell }}
	{filters}
/>

{#snippet filters()}
	<Select
		type="single"
		value={status.current ?? ''}
		onValueChange={(v) => (status.current = v ? (v as OrderRow['status']) : null)}
	>
		<SelectTrigger class="w-full md:w-48" aria-label="Filtrar por estado">
			{statusTriggerLabel}
		</SelectTrigger>
		<SelectContent>
			<SelectItem value="">Estado: todos</SelectItem>
			{#each ORDER_STATUSES as value (value)}
				<SelectItem {value}>{ORDER_STATUS_LABELS[value]}</SelectItem>
			{/each}
		</SelectContent>
	</Select>
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

{#snippet actionsCell({ row }: DataTableCellSnippetProps<OrderRow>)}
	<AdminOrderRefundButton order={row} />
{/snippet}
