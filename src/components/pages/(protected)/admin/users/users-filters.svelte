<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import {
		Select,
		SelectContent,
		SelectItem,
		SelectTrigger
	} from '@/components/ui/select/index.js';

	/**
	 * Filter bar for `/admin/users`. Lives outside the route file so the page can
	 * stay focused on data flow (queryArgs, mutations, dialogs).
	 *
	 * State is bindable — the page owns the values so it can derive `queryArgs`
	 * for the DataTable. Each prop maps 1:1 to a `fetchUsers` arg.
	 */
	let {
		searchField = $bindable<'email' | 'name'>('email'),
		role = $bindable<'user' | 'admin' | undefined>(undefined),
		banned = $bindable<boolean | undefined>(undefined),
		emailVerified = $bindable<boolean | undefined>(undefined)
	}: {
		searchField?: 'email' | 'name';
		role?: 'user' | 'admin' | undefined;
		banned?: boolean | undefined;
		emailVerified?: boolean | undefined;
	} = $props();

	const hasActiveFilter = $derived(
		role !== undefined || banned !== undefined || emailVerified !== undefined
	);

	function clearFilters() {
		role = undefined;
		banned = undefined;
		emailVerified = undefined;
	}
</script>

<Select
	type="single"
	value={searchField}
	onValueChange={(v) => (searchField = (v as 'email' | 'name') || 'email')}
>
	<SelectTrigger class="w-36">
		<span>
			{`Buscar: ${searchField === 'email' ? 'Correo' : 'Nombre'}`}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="email">Correo</SelectItem>
		<SelectItem value="name">Nombre</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={role ?? ''}
	onValueChange={(v) => (role = v === '' ? undefined : (v as 'user' | 'admin'))}
>
	<SelectTrigger class="w-32">
		<span>
			{#if role}
				{`Rol: ${role === 'admin' ? 'Administrador' : 'Usuario'}`}
			{:else}
				Cualquier rol
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">Cualquier rol</SelectItem>
		<SelectItem value="user">Usuario</SelectItem>
		<SelectItem value="admin">Administrador</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={banned === undefined ? '' : String(banned)}
	onValueChange={(v) => (banned = v === '' ? undefined : v === 'true')}
>
	<SelectTrigger class="w-36">
		<span>
			{#if banned === undefined}
				Cualquier estado
			{:else if banned}
				Bloqueado
			{:else}
				Activo
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">Cualquier estado</SelectItem>
		<SelectItem value="true">Bloqueado</SelectItem>
		<SelectItem value="false">Activo</SelectItem>
	</SelectContent>
</Select>

<Select
	type="single"
	value={emailVerified === undefined ? '' : String(emailVerified)}
	onValueChange={(v) => (emailVerified = v === '' ? undefined : v === 'true')}
>
	<SelectTrigger class="w-44">
		<span>
			{#if emailVerified === undefined}
				Cualquier verificación
			{:else if emailVerified}
				Verificado
			{:else}
				Sin verificar
			{/if}
		</span>
	</SelectTrigger>
	<SelectContent>
		<SelectItem value="">Cualquier verificación</SelectItem>
		<SelectItem value="true">Verificado</SelectItem>
		<SelectItem value="false">Sin verificar</SelectItem>
	</SelectContent>
</Select>

{#if hasActiveFilter}
	<Button variant="ghost" size="sm" onclick={clearFilters}>Limpiar</Button>
{/if}
