<script lang="ts">
	// SVELTEKIT IMRORTS
	import { page } from '$app/state';

	// LIBRARIES
	import { useQuery } from 'convex-svelte';
	import { api } from '@/convex/_generated/api';

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/custom-components/svelte-head/svelte-head.svelte';
	import NativeAvatar from '@/components/ui/native-components/native-avatar/native-avatar.svelte';
	import Link from '@/components/ui/custom-components/link/link.svelte';
	import { Badge } from '@/components/ui/badge';
	import ErrorComponent from '@/components/ui/custom-components/error-component/error-component.svelte';
	import EmptyData from '@/components/ui/custom-components/empty-data/empty-data.svelte';
	import UserLoading from '@/components/pages/(protected)/admin/user/loading/user-loading.svelte';
	import UserUpdateRoleButton from '@/components/pages/(protected)/admin/user/user-update-role-button.svelte';

	const userQuery = useQuery(api.tables.users.queries.fetchUserAdmin.fetchUserAdmin, () =>
		page.params.id ? { id: page.params.id } : 'skip'
	);

	const user = $derived(userQuery.data ?? null);
</script>

<SvelteHead title="Usuario" noindex />

<section class="flex w-full flex-col gap-6 p-4 md:p-6">
	<Link
		href={ADMIN_PAGE_ENDPOINTS.USERS}
		class="inline-flex w-fit items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
	>
		<span class="icon-[lucide--arrow-left] size-4" aria-hidden="true"></span>Usuarios
	</Link>

	{#if userQuery.error}
		<ErrorComponent
			variant="alert"
			title="No se pudo cargar el usuario"
			description="Inténtalo de nuevo."
			onRetry={() => location.reload()}
		/>
	{:else if userQuery.isLoading}
		<UserLoading />
	{:else if !user}
		<EmptyData title="Usuario no encontrado" description="La cuenta no existe o fue eliminada.">
			{#snippet icon()}<span class="icon-[lucide--user-x] size-5" aria-hidden="true"
				></span>{/snippet}
		</EmptyData>
	{:else}
		<div class="flex items-center gap-4">
			<NativeAvatar name={user.name} image={user.image} size="lg" />
			<div class="min-w-0">
				<h1 class="truncate text-2xl font-semibold tracking-tight">{user.name}</h1>
				<p class="truncate text-sm text-muted-foreground">{user.email}</p>
			</div>
		</div>
		<dl class="grid max-w-xl gap-4 rounded-xl border bg-card p-5 text-sm sm:grid-cols-2">
			<div>
				<dt class="text-muted-foreground">Rol</dt>
				<dd class="mt-1">
					{#key user.id + ':' + user.role}
						<UserUpdateRoleButton userId={user.id} role={user.role} />
					{/key}
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Estado</dt>
				<dd class="mt-1">
					<Badge variant={user.banned ? 'destructive' : 'outline'}
						>{user.banned ? 'Suspendido' : 'Activo'}</Badge
					>
				</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Correo</dt>
				<dd class="mt-1">{user.emailVerified ? 'Verificado' : 'Sin verificar'}</dd>
			</div>
			<div>
				<dt class="text-muted-foreground">Registro</dt>
				<dd class="mt-1">{new Date(user.createdAt).toLocaleDateString('es-MX')}</dd>
			</div>
		</dl>
	{/if}
</section>
