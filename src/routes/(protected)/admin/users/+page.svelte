<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// UTILS
	import { appHref } from '@/utils/app-navigation.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import DataTable from '@/components/ui/data-table/convex-data-table.svelte';
	import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar/index.js';
	import UsersFilters from '@/components/pages/(protected)/admin/users/users-filters.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	// TYPES
	import type { ColumnDef, DataTableCellSnippetProps } from '@/components/ui/data-table/types.js';
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	// Filter / sort / search state — forwarded to `fetchUsers` via DataTable's
	// `queryArgs` (filters) + `bind:sortColumn` (sort) + `bind:search` (search text).
	let searchField = $state<'email' | 'name'>('email');
	let role = $state<'user' | 'admin' | undefined>(undefined);
	let banned = $state<boolean | undefined>(undefined);
	let emailVerified = $state<boolean | undefined>(undefined);
	let sortColumn = $state<string | undefined>(undefined);
	let sortDirection = $state<'asc' | 'desc' | undefined>(undefined);
	let search = $state<string>('');

	const queryArgs = $derived({
		searchField,
		...(role !== undefined && { role }),
		...(banned !== undefined && { banned }),
		...(emailVerified !== undefined && { emailVerified })
	});

	const columns: ColumnDef<Doc<'user'>>[] = [
		{
			id: 'name',
			header: 'Usuario',
			accessor: (r) => capitalizeFirst(r.name || r.email),
			sortable: true
		},
		{
			id: 'email',
			header: 'Correo',
			accessor: (r) => r.email,
			hideBelow: 'md'
		},
		{
			id: 'role',
			header: 'Rol',
			accessor: (r) => capitalizeFirst(r.role),
			hideBelow: 'md'
		},
		{
			id: 'emailVerified',
			header: 'Verificado',
			accessor: (r) => (r.emailVerified ? 'Sí' : 'No'),
			hideBelow: 'lg'
		},
		{
			id: 'banned',
			header: 'Estado',
			accessor: (r) => (r.banned ? 'Bloqueado' : 'Activo'),
			hideBelow: 'md'
		},
		{
			id: 'createdAt',
			header: 'Creado',
			accessor: (r) => new Date(r._creationTime).toLocaleDateString(),
			sortable: true,
			hideBelow: 'lg'
		}
	];
</script>

<SvelteHead
	title="Usuarios"
	noindex
	description="Busca, filtra y administra las cuentas de usuario de Vindima."
/>

<section class="flex w-full flex-col gap-4 p-4 md:p-6">
	<header class="flex flex-col gap-1">
		<h1 class="text-2xl font-semibold tracking-tight">Usuarios</h1>
		<p class="text-sm text-muted-foreground">Busca, filtra y administra las cuentas de usuario.</p>
	</header>

	<DataTable
		caption="Usuarios"
		query={api.tables.users.userQueries.fetchUsers}
		{queryArgs}
		{columns}
		getRowId={(r) => r._id}
		customCells={{ name: nameCell }}
		bind:sortColumn
		bind:sortDirection
		searchable
		bind:search
		searchPlaceholder={`Buscar por ${searchField === 'name' ? 'nombre' : 'correo'}…`}
		{filters}
	/>
</section>

{#snippet filters()}
	<UsersFilters bind:searchField bind:role bind:banned bind:emailVerified />
{/snippet}

{#snippet nameCell({ row }: DataTableCellSnippetProps<Doc<'user'>>)}
	<a
		href={appHref(ADMIN_PAGE_ENDPOINTS.USER.replace(':id', row._id))}
		class="flex items-center gap-2 hover:underline"
	>
		<Avatar class="size-7">
			{#if row.image}
				<AvatarImage src={row.image} alt={row.name || row.email} />
			{/if}

			<AvatarFallback>
				{(row.name || row.email).slice(0, 2).toUpperCase()}
			</AvatarFallback>
		</Avatar>

		<span class="font-medium">{capitalizeFirst(row.name || row.email)}</span>
	</a>
{/snippet}
