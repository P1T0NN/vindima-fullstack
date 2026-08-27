<script lang="ts">
	// LIBRARIES
	import { authClient } from '@/features/auth/lib/auth-client';

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import Button from '@/components/ui/button/button.svelte';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import { toast } from 'svelte-sonner';

	// UTILS
	import { appGoto } from '@/utils/app-navigation.js';

	// TYPES
	import type { ButtonVariant } from '@/components/ui/button/button.svelte';

	// Optional side-effect run before sign-out — e.g. closing the mobile drawer.
	let {
		onClick,
		class: className,
		variant = 'outline'
	}: {
		onClick?: () => void;
		class?: string;
		variant?: ButtonVariant;
	} = $props();

	let isLoggingOut = $state(false);

	const handleLogout = async () => {
		onClick?.();
		isLoggingOut = true;

		const result = await authClient.signOut();

		if (result.error) {
			console.error('Sign out error:', result.error);
			toast.error(result.error.message as string);
		} else {
			appGoto(UNPROTECTED_PAGE_ENDPOINTS.LOGIN);
		}

		isLoggingOut = false;
	};
</script>

<Button {variant} class={className} onclick={handleLogout} disabled={isLoggingOut}>
	{#if isLoggingOut}
		<Spinner />
	{:else}
		<span class="icon-[lucide--log-out] h-5 w-5" ></span>
	{/if}

	<span>Cerrar sesión</span>
</Button>
