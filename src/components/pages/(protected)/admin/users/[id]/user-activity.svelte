<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// COMPONENTS
	import DataTable from '@/components/ui/data-table/convex-data-table.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	// TYPES
	import type { Doc } from '@/convex/_generated/dataModel';
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';

	let { userId }: { userId: string } = $props();

	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<'asc' | 'desc' | undefined>(undefined);

	const queryArgs = $derived({ userId });

	/** `user.role.update` → `User role update`. */
	function formatAction(action: string): string {
		return capitalizeFirst(action.replaceAll('.', ' ').replaceAll('_', ' '));
	}

	const columns: ColumnDef<Doc<'auditLogs'>>[] = [
		{
			id: 'action',
			header: 'Action',
			accessor: (r) => formatAction(r.action)
		},
		{
			id: 'status',
			header: 'Status',
			accessor: (r) => (r.status === 'failure' ? 'Failed' : 'Success'),
			hideBelow: 'md'
		},
		{
			id: 'resource',
			header: 'Resource',
			accessor: (r) => (r.resource ? `${r.resource.table}#${r.resource.id}` : '—'),
			hideBelow: 'lg',
			cellClass: 'max-w-[16rem]'
		},
		{
			id: 'ip',
			header: 'IP',
			accessor: (r) => r.ip ?? '—',
			hideBelow: 'lg'
		},
		{
			id: 'createdAt',
			header: 'When',
			accessor: (r) => new Date(r._creationTime).toLocaleString(),
			sortable: true
		}
	];
</script>

<div class="flex flex-col gap-4">
	<header class="flex flex-col gap-0.5">
		<h2 class="text-base font-semibold">Activity</h2>
		<p class="text-sm text-muted-foreground">
			Audit log entries scoped to this user. Newest first.
		</p>
	</header>

	<DataTable
		caption="Activity"
		query={api.tables.auditLog.queries.auditLogQueries.fetchAuditLogs}
		{queryArgs}
		{columns}
		getRowId={(r) => r._id}
		customCells={{ status: statusCell }}
		bind:sortColumn
		bind:sortDirection
	/>
</div>

{#snippet statusCell({ row }: DataTableCellSnippetProps<Doc<'auditLogs'>>)}
	{#if row.status === 'failure'}
		<span class="rounded bg-destructive/10 px-1.5 py-0.5 text-xs font-medium text-destructive">
			Failed
		</span>
	{:else}
		<span class="rounded bg-muted px-1.5 py-0.5 text-xs font-medium text-muted-foreground">
			Success
		</span>
	{/if}
{/snippet}
