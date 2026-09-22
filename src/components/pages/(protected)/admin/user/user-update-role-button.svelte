<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/auth-client';

	// COMPONENTS
	import { toast } from 'svelte-sonner';
	import { Button } from '@/components/ui/button';
	import {
		Select,
		SelectContent,
		SelectGroup,
		SelectItem,
		SelectTrigger
	} from '@/components/ui/select';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	let { userId, role }: { userId: string; role: string } = $props();

	let selectedRole = $state<string | undefined>();
	let savedRole = $state<string | undefined>();
	let saving = $state(false);

	const currentSelection = $derived(selectedRole ?? role);
	const currentRole = $derived(savedRole ?? role);

	const canSave = $derived(
		currentSelection !== currentRole &&
			(currentSelection === 'admin' || currentSelection === 'user')
	);

	const selectedLabel = $derived(
		currentSelection === 'admin'
			? 'Administrador'
			: currentSelection === 'user'
				? 'Usuario'
				: currentSelection
	);

	async function saveRole(): Promise<void> {
		const nextRole = currentSelection;

		if (!canSave || saving || (nextRole !== 'admin' && nextRole !== 'user')) return;
		saving = true;

		try {
			const { error } = await authClient.admin.setRole({ userId, role: nextRole });
			if (error) {
				toast.error(error.message || 'No se pudo actualizar el rol.');
				return;
			}
			savedRole = nextRole;
			toast.success('Rol actualizado.');
		} catch {
			toast.error('No se pudo actualizar el rol.');
		} finally {
			saving = false;
		}
	}
</script>

<div class="flex flex-wrap items-center gap-3">
	<Select type="single" value={currentSelection} onValueChange={(value) => (selectedRole = value)}>
		<SelectTrigger aria-label="Rol del usuario" class="min-w-40" disabled={saving}
			>{selectedLabel}</SelectTrigger
		>

		<SelectContent>
			<SelectGroup>
				{#if role !== 'admin' && role !== 'user'}
					<SelectItem value={role} label={role}>{role}</SelectItem>
				{/if}
				<SelectItem value="user" label="Usuario">Usuario</SelectItem>
				<SelectItem value="admin" label="Administrador">Administrador</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>

	<Button size="sm" variant="outline" disabled={!canSave || saving} onclick={saveRole}>
		{#if saving}<Spinner class="size-3.5" />{/if}
		Guardar rol
	</Button>
</div>

{#if canSave}
	<p class="mt-2 text-xs text-muted-foreground">Cambio pendiente: {selectedLabel}</p>
{/if}
