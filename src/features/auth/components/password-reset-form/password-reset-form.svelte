<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import Spinner from '@/components/ui/spinner/spinner.svelte';
	import * as Card from '@/components/ui/card/index.js';
	import * as InputOTP from '@/features/auth/components/input-otp/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import {
		FieldGroup,
		Field,
		FieldLabel,
		FieldDescription,
		FieldError
	} from '@/components/ui/field/index.js';
	import { FormField } from '@/components/ui/form-field/index.js';
	import Logo from '@/components/ui/logo/logo.svelte';
	import EmailVerificationResend from '@/features/auth/components/email-verification-form/email-verification-resend.svelte';

	import { createPasswordResetForm } from './password-reset-form-model.svelte.js';

	/** Matches `convexGenerateVerificationToken` and `passwordResetVerifyFormSchema`. */
	const OTP_MAX_LENGTH = 8;

	const id = $props.id();

	const form = createPasswordResetForm();
</script>

{#if form.step === 'forgot'}
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Logo class="mb-2 self-start" />
			<Card.Title class="font-display text-3xl font-semibold tracking-wide text-accent uppercase"
				>Restablece tu contraseña</Card.Title
			>
			<Card.Description
				>Ingresa el correo electrónico de tu cuenta. Te enviaremos un código de un solo uso para
				elegir una nueva contraseña.</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<form onsubmit={form.onForgotSubmit}>
				<FieldGroup>
					<FormField id="pr-email-{id}" label="Correo electrónico" error={form.fieldErrors.email}>
						<Input
							id="pr-email-{id}"
							name="email"
							type="email"
							autocomplete="email"
							placeholder="m@example.com"
							bind:value={form.emailDraft}
							aria-invalid={form.fieldErrors.email ? 'true' : undefined}
							aria-describedby={form.fieldErrors.email ? `pr-email-${id}-error` : undefined}
							class="h-auto rounded-sm px-3 py-3"
						/>
					</FormField>

					<input type="hidden" name="flow" value="reset" />
					<!-- Always-mounted live region so failures are announced; -mt-7 collapses the
					     group gap it would otherwise add while empty. -->
					<div
						role="status"
						aria-live="polite"
						class="text-sm font-normal text-destructive{form.errorMessage ? '' : ' -mt-7'}"
					>
						{form.errorMessage ?? ''}
					</div>

					<Field>
						<Button type="submit" class="w-full" disabled={form.busy}>
							{#if form.busy}<Spinner class="size-3.5" />{/if}
							Enviar código
						</Button>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Logo class="mb-2 self-start" />
			<Card.Title class="font-display text-3xl font-semibold tracking-wide text-accent uppercase"
				>Elige una nueva contraseña</Card.Title
			>
			<Card.Description class="text-balance">
				{`Enviamos un código a ${form.step.email}. Ingrésalo abajo junto con tu nueva contraseña. El código es válido por 5 minutos.`}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={form.onResetSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel for="pr-code-{id}">Código</FieldLabel>
						<InputOTP.Root
							id="pr-otp-{id}"
							inputId="pr-code-{id}"
							maxlength={OTP_MAX_LENGTH}
							name="code"
							required
							autofocus
							disabled={form.busy}
							aria-invalid={form.fieldErrors.code ? 'true' : undefined}
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
						<FieldDescription
							>Ingresa el código de 8 dígitos de tu correo electrónico.</FieldDescription
						>
						{#if form.fieldErrors.code}
							<FieldError>{form.fieldErrors.code}</FieldError>
						{/if}
					</Field>

					<FormField
						id="pr-new-pw-{id}"
						label="Nueva contraseña"
						error={form.fieldErrors.newPassword}
					>
						<PasswordInput
							id="pr-new-pw-{id}"
							name="newPassword"
							autocomplete="new-password"
							bind:value={form.newPassword}
							aria-invalid={form.fieldErrors.newPassword ? 'true' : undefined}
							aria-describedby={form.fieldErrors.newPassword ? `pr-new-pw-${id}-error` : undefined}
							class="h-auto rounded-sm px-3 py-3"
						/>
					</FormField>

					<FormField
						id="pr-confirm-pw-{id}"
						label="Confirmar nueva contraseña"
						error={form.fieldErrors.confirmPassword}
					>
						<PasswordInput
							id="pr-confirm-pw-{id}"
							name="confirmPassword"
							autocomplete="new-password"
							bind:value={form.confirmPassword}
							aria-invalid={form.fieldErrors.confirmPassword ? 'true' : undefined}
							aria-describedby={form.fieldErrors.confirmPassword
								? `pr-confirm-pw-${id}-error`
								: undefined}
							class="h-auto rounded-sm px-3 py-3"
						/>
					</FormField>

					<!-- Visually hidden (not type="hidden") so password managers pair the saved
					     username with the new password. -->
					<input
						type="text"
						name="email"
						value={form.step.email}
						autocomplete="username"
						readonly
						tabindex="-1"
						aria-hidden="true"
						class="sr-only"
					/>
					<input type="hidden" name="flow" value="reset-verification" />

					<!-- Always-mounted live region so failures are announced; -mt-7 collapses the
					     group gap it would otherwise add while empty. -->
					<div
						role="status"
						aria-live="polite"
						class="text-sm font-normal text-destructive{form.errorMessage ? '' : ' -mt-7'}"
					>
						{form.errorMessage ?? ''}
					</div>

					<Field>
						<Button type="submit" class="w-full" disabled={form.busy}>
							{#if form.busy}<Spinner class="size-3.5" />{/if}
							Continuar
						</Button>
						<Button
							type="button"
							variant="outline"
							class="w-full"
							disabled={form.busy}
							onclick={form.backToForgot}
						>
							Cancelar
						</Button>
					</Field>

					<EmailVerificationResend
						disabled={form.busy}
						config={{ email: form.step.email, type: 'forget-password' }}
						onSendingChange={(inFlight) => {
							if (inFlight) {
								form.busy = true;
								form.errorMessage = null;
							} else {
								form.busy = false;
							}
						}}
					/>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
{/if}
