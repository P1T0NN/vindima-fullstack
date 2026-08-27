<script lang="ts">
	// LIBRARIES
	import { toast } from 'svelte-sonner';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { FieldDescription } from '@/components/ui/field/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';

	// UTILS
	import { authClient } from '@/features/auth/lib/auth-client';
	import { formatRateLimitMessage } from '@/utils/toastMessage';

	// TYPES
	import type { EmailVerificationResendConfig } from './emailVerificationFormTypes.js';

	let {
		disabled = false,
		config,
		/** Optional: lock parent form while a resend request is in flight (e.g. password reset). */
		onSendingChange,
		cooldownSeconds = 30
	}: {
		disabled?: boolean;
		config: EmailVerificationResendConfig;
		onSendingChange?: (inFlight: boolean) => void;
		cooldownSeconds?: number;
	} = $props();

	let resending = $state(false);
	let cooldownRemaining = $state(0);
	let cooldownIntervalId: ReturnType<typeof setInterval> | null = null;

	const blocked = $derived(disabled || resending || cooldownRemaining > 0);

	function clearCooldownInterval() {
		if (cooldownIntervalId !== null) {
			clearInterval(cooldownIntervalId);
			cooldownIntervalId = null;
		}
	}

	function startCooldown() {
		clearCooldownInterval();
		cooldownRemaining = cooldownSeconds;
		cooldownIntervalId = setInterval(() => {
			cooldownRemaining -= 1;
			if (cooldownRemaining <= 0) {
				cooldownRemaining = 0;
				clearCooldownInterval();
			}
		}, 1000);
	}

	$effect(() => () => clearCooldownInterval());

	async function handleResend() {
		if (blocked) return;

		resending = true;
		onSendingChange?.(true);

		try {
			const { error } = await authClient.emailOtp.sendVerificationOtp({
				email: config.email,
				type: config.type
			});
			if (error) {
				console.error('Email verification: resend failed:', error);
				toast.error(
					formatRateLimitMessage(error.message, 'No se pudo reenviar el código. Inténtalo de nuevo.')
				);
			}
		} catch (error) {
			console.error('Email verification: resend failed:', error);
			toast.error('No se pudo reenviar el código. Inténtalo de nuevo.');
		} finally {
			resending = false;
			onSendingChange?.(false);
			startCooldown();
		}
	}
</script>

<FieldDescription class="text-center">
	<span class="inline-flex flex-wrap items-center justify-center gap-x-1">
		<span>¿No recibiste el código?</span>

		<Button
			type="button"
			variant="link"
			class="h-auto p-0 text-sm"
			disabled={blocked}
			onclick={handleResend}
		>
			{#if resending}<Spinner class="size-3.5" />{/if}
			{cooldownRemaining > 0 ? `Reenviar en ${cooldownRemaining}s` : 'Reenviar'}
		</Button>
	</span>
</FieldDescription>
