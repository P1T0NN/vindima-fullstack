<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { FieldDescription } from '@/components/ui/field/index.js';

	// UTILS
	import { authClient } from '@/features/auth/lib/auth-client';

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
			}
		} catch (error) {
			console.error('Email verification: resend failed:', error);
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
			{cooldownRemaining > 0 ? `Reenviar en ${cooldownRemaining}s` : 'Reenviar'}
		</Button>
	</span>
</FieldDescription>
