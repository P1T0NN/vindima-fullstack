<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import UserDangerZoneItem from './user-danger-zone-item.svelte';
	import ChangeRoleButton from './change-role-button.svelte';
	import UnbanUserButton from './unban-user-button.svelte';
	import BanUserDialog from './ban-user-dialog.svelte';
	import DeleteUserDialog from './delete-user-dialog.svelte';

	// UTILS
	import { capitalizeFirst } from '@/shared/utils/stringUtils';

	// TYPES
	import type { Doc } from '@/convex/auth/component/_generated/dataModel';

	let { user }: { user: Doc<'user'> } = $props();
</script>

<div class="flex flex-col gap-4 rounded-lg border border-destructive/40 p-4">
	<header class="flex flex-col gap-1">
		<h2 class="text-base font-semibold text-destructive">Zona de peligro</h2>
		<p class="text-sm text-muted-foreground">
			Acciones a nivel de cuenta. Los cambios aquí se auditan y pueden ser irreversibles.
		</p>
	</header>

	<UserDangerZoneItem
		title={`Rol: ${capitalizeFirst(user.role)}`}
		description={user.role === 'admin'
			? 'Quitar los privilegios de admin de esta cuenta.'
			: 'Otorgar privilegios de admin a esta cuenta.'}
	>
		<ChangeRoleButton userId={user._id} userEmail={user.email} role={user.role} />
	</UserDangerZoneItem>

	<UserDangerZoneItem
		title={user.banned ? 'Bloqueado' : 'Activo'}
		description={user.banned
			? 'Levantar el bloqueo para que el usuario pueda iniciar sesión de nuevo.'
			: 'Cerrar la sesión del usuario y evitar futuros inicios de sesión.'}
	>
		{#if user.banned}
			<UnbanUserButton userId={user._id} />
		{:else}
			<BanUserDialog userId={user._id} userEmail={user.email} />
		{/if}
	</UserDangerZoneItem>

	<DeleteUserDialog
		userId={user._id}
		userEmail={user.email}
		role={user.role}
		redirectUrl={ADMIN_PAGE_ENDPOINTS.USERS}
	/>
</div>
