<script lang="ts">
	// LIBRARIES
	import { api } from '@/convex/_generated/api';
	import { useConvexClient } from 'convex-svelte';

	// COMPONENTS
	import ActionButton from '@/components/ui/action-button/action-button.svelte';

	// UTILS
	import { safeMutation } from '@/utils/convexHelpers';
	import { toastResult } from '@/utils/toastResult';

	/**
	 * Admin-only promote/demote control for this app’s two-role model (`user` ↔ `admin`).
	 * Convex call, copy, and pending state stay in this file so the danger zone layout
	 * does not own mutation wiring for a single nested action.
	 */
	let {
		userId,
		userEmail,
		role
	}: {
		userId: string;
		userEmail: string;
		role: string;
	} = $props();

	const convex = useConvexClient();
	let isPending = $state(false);

	const demoting = $derived(role === 'admin');

	async function confirmRoleChange() {
		const nextRole = role === 'admin' ? 'user' : 'admin';
		isPending = true;
		try {
			const result = await safeMutation(convex, api.tables.users.userMutations.setUserRole, {
				userId,
				role: nextRole
			});
			toastResult(result);
		} finally {
			isPending = false;
		}
	}
</script>

<ActionButton
	function={confirmRoleChange}
	variant="outline"
	{isPending}
	title={demoting ? `¿Degradar a ${userEmail} a usuario?` : `¿Promover a ${userEmail} a admin?`}
	description={demoting
		? '¿Estás seguro de que quieres hacer esto? El usuario perderá los privilegios de admin de inmediato.'
		: '¿Estás seguro de que quieres hacer esto? El usuario obtendrá privilegios completos de admin, incluida la capacidad de bloquear y eliminar otras cuentas.'}
>
	{demoting ? 'Degradar a usuario' : 'Promover a admin'}
</ActionButton>
