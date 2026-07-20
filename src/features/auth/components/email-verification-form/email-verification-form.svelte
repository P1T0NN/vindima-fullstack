<script lang="ts">
	// LIBRARIES

	// UTILS
	import { authClient } from '@/features/auth/lib/auth-client';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import { FieldGroup, Field, FieldLabel, FieldError } from '@/components/ui/field/index.js';
	import { Button } from '@/components/ui/button/index.js';
	import * as InputOTP from '@/features/auth/components/input-otp/index.js';
	import EmailVerificationResend from './email-verification-resend.svelte';

	const OTP_MAX_LENGTH = 8;

	// UTILS
	import { emailVerificationFormSchema } from './email-verification-form-schema.js';
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import { zodIssuesToFieldErrors } from '@/shared/utils/validationUtils.js';
	import { rateLimitMessage } from '@/shared/utils/rateLimitMessages';

	// TYPES
	import type { HTMLFormAttributes } from 'svelte/elements';
	import type {
		EmailVerificationField,
		EmailVerificationResendConfig
	} from './emailVerificationFormTypes.js';
	import type { FieldErrors } from '@/shared/types/types';

	const id = $props.id();

	let busy = $state(false);
	let errorMessage = $state<string | null>(null);
	let fieldErrors = $state<FieldErrors<EmailVerificationField>>({});

	let {
		email,
		fullWidthButtons = false,
		variant = 'form',
		ref = $bindable(null),
		class: className,
		onCancel,
		onSuccess,
		resend,
		...restProps
	}: {
		email: string;
		/** W-full on submit + cancel (e.g. card layout) */
		fullWidthButtons?: boolean;
		/** `form` = centered h1 in form (login-with-image); `card` = Card header + form body (login-no-image) */
		variant?: 'form' | 'card';
		onCancel: () => void;
		/** Called after `signIn` succeeds — parent decides toast + navigation. */
		onSuccess?: () => void | Promise<void>;
		/** Re-send OTP — built in `EmailVerificationResend` via `signIn`. */
		resend?: EmailVerificationResendConfig;
	} & Omit<WithElementRef<HTMLFormAttributes>, 'onsubmit' | 'children' | 'onCancel'> = $props();

	async function onVerifySubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const p = emailVerificationFormSchema.safeParse({
			code: String(formData.get('code') ?? ''),
			email: String(formData.get('email') ?? ''),
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<EmailVerificationField>(p.error.issues);
			errorMessage = null;
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		try {
			const { error } = await authClient.emailOtp.verifyEmail({
				email: p.data.email,
				otp: p.data.code
			});
			if (error) {
				console.error('Email verification: verifyEmail failed:', error);
				errorMessage = rateLimitMessage(
					error.message,
					'Código inválido o expirado. Inténtalo de nuevo.'
				);
				busy = false;
				return;
			}
		} catch (error) {
			console.error('Email verification: verifyEmail failed:', error);
			errorMessage = 'Código inválido o expirado. Inténtalo de nuevo.';
			busy = false;
			return;
		}

		// Parent handles toast + redirect; clear busy if we stay mounted (e.g. no redirect).
		await onSuccess?.();
		busy = false;
	}

	function handleCancel() {
		errorMessage = null;
		fieldErrors = {};
		onCancel();
	}
</script>

{#if variant === 'card'}
	<Card.Header>
		<Card.Title class="text-2xl">Revisa tu correo electrónico</Card.Title>

		<Card.Description>
			{`Enviamos un código de verificación a ${email}. Ingrésalo abajo para continuar.`}
		</Card.Description>
	</Card.Header>

	<Card.Content>
		<form class="w-full" onsubmit={onVerifySubmit}>
			<FieldGroup>
				<Field>
					<FieldLabel for="ev-code-{id}">Código de verificación</FieldLabel>
					<InputOTP.Root
						id="ev-otp-{id}"
						inputId="ev-code-{id}"
						maxlength={OTP_MAX_LENGTH}
						name="code"
						required
						autofocus
						disabled={busy}
						aria-invalid={fieldErrors.code ? 'true' : undefined}
					>
						{#snippet children({ cells })}
							<InputOTP.Group
								class="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border"
							>
								{#each cells as cell, i (i)}
									<InputOTP.Slot {cell} />
								{/each}
							</InputOTP.Group>
						{/snippet}
					</InputOTP.Root>
					{#if fieldErrors.code}
						<FieldError>{fieldErrors.code}</FieldError>
					{/if}
				</Field>

				<input type="hidden" name="email" value={email} />
				<input type="hidden" name="flow" value="email-verification" />

				{#if errorMessage}
					<FieldError>{errorMessage}</FieldError>
				{/if}

				<Field>
					<Button type="submit" class={fullWidthButtons ? 'w-full' : ''} disabled={busy}>
						Continuar
					</Button>
					<Button
						type="button"
						variant="outline"
						class={fullWidthButtons ? 'w-full' : ''}
						disabled={busy}
						onclick={handleCancel}
					>
						Cancelar
					</Button>
				</Field>
				{#if resend}
					<EmailVerificationResend disabled={busy} config={resend} />
				{/if}
			</FieldGroup>
		</form>
	</Card.Content>
{:else}
	<form
		class={cn('flex flex-col gap-6', className)}
		bind:this={ref}
		onsubmit={onVerifySubmit}
		{...restProps}
	>
		<FieldGroup>
			<div class="flex flex-col items-center gap-1 text-center">
				<h1 class="text-2xl font-bold">Revisa tu correo electrónico</h1>
				<p class="text-sm text-balance text-muted-foreground">
					{`Enviamos un código de verificación a ${email}. Ingrésalo abajo para continuar.`}
				</p>
			</div>

			<Field>
				<FieldLabel for="ev-code-{id}-stacked">Código de verificación</FieldLabel>
				<InputOTP.Root
					id="ev-otp-{id}-stacked"
					inputId="ev-code-{id}-stacked"
					maxlength={OTP_MAX_LENGTH}
					name="code"
					required
					autofocus
					disabled={busy}
					aria-invalid={fieldErrors.code ? 'true' : undefined}
				>
					{#snippet children({ cells })}
						<InputOTP.Group
							class="gap-2.5 *:data-[slot=input-otp-slot]:rounded-md *:data-[slot=input-otp-slot]:border"
						>
							{#each cells as cell, i (i)}
								<InputOTP.Slot {cell} />
							{/each}
						</InputOTP.Group>
					{/snippet}
				</InputOTP.Root>
				{#if fieldErrors.code}
					<FieldError>{fieldErrors.code}</FieldError>
				{/if}
			</Field>

			<input type="hidden" name="email" value={email} />
			<input type="hidden" name="flow" value="email-verification" />

			{#if errorMessage}
				<FieldError>{errorMessage}</FieldError>
			{/if}

			<Field>
				<Button type="submit" class={fullWidthButtons ? 'w-full' : ''} disabled={busy}>
					Continuar
				</Button>
				<Button
					type="button"
					variant="outline"
					class={fullWidthButtons ? 'w-full' : ''}
					disabled={busy}
					onclick={handleCancel}
				>
					Cancelar
				</Button>
			</Field>
			{#if resend}
				<EmailVerificationResend disabled={busy} config={resend} />
			{/if}
		</FieldGroup>
	</form>
{/if}
