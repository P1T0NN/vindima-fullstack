<script lang="ts">
	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { NativeSelect } from '@/components/ui/select/index.js';

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

<NativeSelect
	class="w-36"
	ariaLabel="Campo de búsqueda"
	bind:value={() => searchField, (v) => (searchField = (v as 'email' | 'name') || 'email')}
	options={[
		{ value: 'email', label: 'Buscar: Correo' },
		{ value: 'name', label: 'Buscar: Nombre' }
	]}
/>

<NativeSelect
	class="w-36"
	ariaLabel="Filtrar por rol"
	bind:value={() => role ?? '', (v) => (role = v === '' ? undefined : (v as 'user' | 'admin'))}
	options={[
		{ value: '', label: 'Cualquier rol' },
		{ value: 'user', label: 'Usuario' },
		{ value: 'admin', label: 'Administrador' }
	]}
/>

<NativeSelect
	class="w-36"
	ariaLabel="Filtrar por estado"
	bind:value={
		() => (banned === undefined ? '' : String(banned)),
		(v) => (banned = v === '' ? undefined : v === 'true')
	}
	options={[
		{ value: '', label: 'Cualquier estado' },
		{ value: 'true', label: 'Bloqueado' },
		{ value: 'false', label: 'Activo' }
	]}
/>

<NativeSelect
	class="w-44"
	ariaLabel="Filtrar por verificación"
	bind:value={
		() => (emailVerified === undefined ? '' : String(emailVerified)),
		(v) => (emailVerified = v === '' ? undefined : v === 'true')
	}
	options={[
		{ value: '', label: 'Cualquier verificación' },
		{ value: 'true', label: 'Verificado' },
		{ value: 'false', label: 'Sin verificar' }
	]}
/>

{#if hasActiveFilter}
	<Button variant="outline" size="sm" onclick={clearFilters}>Limpiar</Button>
{/if}
