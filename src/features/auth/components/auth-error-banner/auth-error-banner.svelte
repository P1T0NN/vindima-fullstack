<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';
	import { goto } from '$app/navigation';

	// COMPONENTS
	import * as AlertDialog from '@/components/ui/alert-dialog/index.js';

	// LUCIDE ICONS
	import ShieldAlertIcon from '@lucide/svelte/icons/shield-alert';

	/**
	 * Surfaces auth-related redirect errors that BA appends as query params
	 * (e.g. `?error=banned&error_description=…` after a banned user is bounced
	 * out of a sign-in callback). Mounted once in the root layout so it catches
	 * the redirect regardless of which path it landed on.
	 *
	 * Dismiss writes a clean URL via `goto(replaceState: true)` so a refresh
	 * doesn't re-open the dialog.
	 */

	/** Map of known BA error codes → human-readable titles. Unknown codes fall back to a generic title. */
	const TITLES: Record<string, string> = {
		banned: 'Cuenta suspendida',
		access_denied: 'Acceso denegado',
		unauthorized: 'Se requiere iniciar sesión'
	};

	const error = $derived(page.url.searchParams.get('error'));
	const description = $derived(page.url.searchParams.get('error_description'));
	const open = $derived(error !== null);
	const title = $derived(error ? (TITLES[error] ?? 'Error al iniciar sesión') : '');

	function dismiss() {
		const url = new URL(page.url);
		url.searchParams.delete('error');
		url.searchParams.delete('error_description');
		goto(url.pathname + url.search + url.hash, { replaceState: true, noScroll: true });
	}
</script>

<AlertDialog.Root
	{open}
	onOpenChange={(o) => {
		if (!o) dismiss();
	}}
>
	<AlertDialog.Content>
		<AlertDialog.Header>
			<div class="flex items-center gap-3">
				<div
					class="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10 text-destructive"
				>
					<ShieldAlertIcon class="size-5" />
				</div>
				<AlertDialog.Title>{title}</AlertDialog.Title>
			</div>
			{#if description}
				<AlertDialog.Description class="pt-2">
					{description}
				</AlertDialog.Description>
			{/if}
		</AlertDialog.Header>

		<AlertDialog.Footer>
			<AlertDialog.Action onclick={dismiss}>Entendido</AlertDialog.Action>
		</AlertDialog.Footer>
	</AlertDialog.Content>
</AlertDialog.Root>
