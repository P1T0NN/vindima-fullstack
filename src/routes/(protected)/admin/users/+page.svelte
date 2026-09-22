<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { PAGINATION_DATA } from '@/shared/features/pagination/config.js';
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// HOOKS
	import { useConvexPagination } from '@/features/pagination/hooks/useConvexPagination.svelte.js';
	import { useSearch } from '@/features/search/hooks/useSearch.svelte';
	import { useFilters } from '@/features/filters/hooks/useFilters.svelte';

	// COMPONENTS
	import DataTable from '@/components/ui/custom-components/data-table/data-table.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import SearchInput from '@/features/search/components/search-input.svelte';
	import NativeSelect from '@/components/ui/native-components/native-select/native-select.svelte';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import { Badge } from '@/components/ui/badge';
	import { Button } from '@/components/ui/button';
	import { TableCell, TableHead } from '@/components/ui/table';

	// TYPERS
	import type { FilterDef } from '@/shared/features/filters/types/filterTypes.js';

	const filterDefs = [
		{
			key: 'role',
			label: 'Rol',
			options: [
				{ value: '', label: 'Todos los roles' },
				{ value: 'admin', label: 'Administradores' },
				{ value: 'user', label: 'Usuarios' }
			]
		},
		{
			key: 'status',
			label: 'Estado',
			options: [
				{ value: '', label: 'Todos los estados' },
				{ value: 'active', label: 'Activos' },
				{ value: 'banned', label: 'Suspendidos' }
			]
		},
		{
			key: 'verification',
			label: 'Verificación',
			options: [
				{ value: '', label: 'Todos' },
				{ value: 'verified', label: 'Verificados' },
				{ value: 'unverified', label: 'Sin verificar' }
			]
		}
	] satisfies FilterDef[];

	const search = useSearch({ mode: 'state' });
	const filters = useFilters({ mode: 'state', defs: filterDefs });
	const users = useConvexPagination(
		api.tables.users.queries.fetchUsersAdmin.fetchUsersAdmin,
		() => ({ search: search.term || undefined, filters: filters.active }),
		{ pageSize: PAGINATION_DATA.DEFAULT_PAGE_SIZE, resetKey: () => [search.term, filters.identity] }
	);
</script>

<SvelteHead title="Usuarios" noindex />

<section class="flex w-full min-w-0 flex-col gap-6 p-4 md:p-6">
	<DataTable pagination={users} key={(user) => user.id} placement="above">
		{#snippet header()}
			<div class="flex flex-col gap-4">
				<div class="flex flex-col gap-1">
					<p class="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
						Administración
					</p>
					<h1 class="text-2xl font-semibold tracking-tight">Usuarios</h1>
					<p class="text-sm text-muted-foreground">Consulta las cuentas registradas.</p>
				</div>
				<div class="flex flex-wrap items-center gap-2">
					<SearchInput
						bind:value={search.value}
						placeholder="Buscar por nombre o correo..."
						label="Buscar usuarios"
						class="w-full sm:max-w-sm"
					/>
					{#each filters.defs as def (def.key)}
						<NativeSelect
							options={def.options}
							value={filters.value(def.key)}
							placeholder={def.label}
							label={def.label}
							onchange={(value) => filters.set(def.key, value)}
						/>
					{/each}
					{#if filters.isActive}
						<Button variant="outline" size="sm" onclick={filters.clearAll}
							>Limpiar filtros ({filters.count})</Button
						>
					{/if}
				</div>
			</div>
		{/snippet}

		{#snippet head()}
			<TableHead class="min-w-56">Usuario</TableHead>
			<TableHead>Rol</TableHead>
			<TableHead>Estado</TableHead>
			<TableHead class="hidden md:table-cell">Registro</TableHead>
		{/snippet}

		{#snippet row(user)}
			<TableCell>
				<Link
					href={ADMIN_PAGE_ENDPOINTS.USERS + '/' + encodeURIComponent(user.id)}
					class="group inline-flex max-w-full min-w-0 items-center gap-3 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
				>
					<NativeAvatar name={user.name} image={user.image} size="sm" />
					<span class="min-w-0">
						<span class="block truncate font-medium group-hover:underline">{user.name}</span>
						<span class="block truncate text-xs text-muted-foreground group-hover:underline"
							>{user.email}</span
						>
					</span>
				</Link>
			</TableCell>
			<TableCell
				><Badge variant={user.role === 'admin' ? 'default' : 'secondary'}
					>{user.role === 'admin'
						? 'Administrador'
						: user.role === 'user'
							? 'Usuario'
							: user.role}</Badge
				></TableCell
			>
			<TableCell>
				{#if user.banned}
					<Badge variant="destructive">Suspendido</Badge>
				{:else if user.emailVerified}
					<Badge variant="outline" class="border-primary/30 bg-primary/5 text-primary"
						>Verificado</Badge
					>
				{:else}
					<Badge variant="outline">Sin verificar</Badge>
				{/if}
			</TableCell>
			<TableCell class="hidden whitespace-nowrap text-muted-foreground md:table-cell"
				>{new Date(user.createdAt).toLocaleDateString('es-MX')}</TableCell
			>
		{/snippet}

		{#snippet errorSnippet()}
			<p
				class="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive"
			>
				No se pudieron cargar los usuarios.
			</p>
		{/snippet}
		
		{#snippet empty()}
			<EmptyData
				title={search.isActive || filters.isActive
					? 'No hay usuarios que coincidan'
					: 'Aún no hay usuarios'}
				description={search.isActive
					? `No hay resultados para “${search.term}”.`
					: filters.isActive
						? 'Prueba con otros filtros.'
						: 'Las cuentas aparecerán aquí cuando se registren.'}
			>
				{#snippet icon()}<span class="icon-[lucide--users] size-5"></span>{/snippet}
			</EmptyData>
		{/snippet}
	</DataTable>
</section>
