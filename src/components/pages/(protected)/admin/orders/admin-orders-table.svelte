<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import ConvexDataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import AdminOrderRefundButton from './admin-order-refund-button.svelte';

	// UTILS
	import { formatMoneyMinor } from '@/utils/formatters.js';

	// TYPES
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';
	import type { Doc } from '@/convex/_generated/dataModel';

	type OrderRow = Doc<'orders'>;

	const STATUS_LABELS: Record<OrderRow['status'], string> = {
		pending: 'Pendiente',
		paid: 'Pagado',
		cancelled: 'Cancelado',
		refunded: 'Reembolsado'
	};

	const STATUS_CLASSES: Record<OrderRow['status'], string> = {
		paid: 'bg-chart-2/15 text-chart-2',
		pending: 'bg-muted text-muted-foreground',
		cancelled: 'bg-destructive/10 text-destructive',
		refunded: 'bg-destructive/10 text-destructive'
	};

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
		{ id: 'status', header: 'Estado', accessor: (r) => STATUS_LABELS[r.status] },
		{ id: 'actions', header: '', accessor: () => '', wrap: true }
	];
</script>

<ConvexDataTable
	caption="Pedidos"
	query={api.tables.orders.queries.fetchOrders.fetchOrders}
	controlsPlace="top"
	{columns}
	getRowId={(r) => r._id}
	customCells={{ status: statusCell, actions: actionsCell }}
/>

{#snippet statusCell({ row }: DataTableCellSnippetProps<OrderRow>)}
	<span class={`inline-flex rounded-sm px-2 py-0.5 text-xs font-medium ${STATUS_CLASSES[row.status]}`}>
		{STATUS_LABELS[row.status]}
	</span>
{/snippet}

{#snippet actionsCell({ row }: DataTableCellSnippetProps<OrderRow>)}
	<AdminOrderRefundButton order={row} />
{/snippet}
