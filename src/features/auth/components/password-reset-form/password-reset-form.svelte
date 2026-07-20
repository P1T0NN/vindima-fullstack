<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
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
			<Card.Title class="text-2xl">Reset your password</Card.Title>
			<Card.Description
				>Enter the email for your account. We will send you a one-time code you can use to choose a
				new password.</Card.Description
			>
		</Card.Header>
		<Card.Content>
			<form onsubmit={form.onForgotSubmit}>
				<FieldGroup>
					<FormField id="pr-email-{id}" label="Email" error={form.fieldErrors.email}>
						<Input
							id="pr-email-{id}"
							name="email"
							type="email"
							autocomplete="email"
							placeholder="m@example.com"
							autofocus
							bind:value={form.emailDraft}
							aria-invalid={form.fieldErrors.email ? 'true' : undefined}
						/>
					</FormField>

					<input type="hidden" name="flow" value="reset" />
					{#if form.errorMessage}
						<FieldError>{form.errorMessage}</FieldError>
					{/if}

					<Field>
						<Button type="submit" class="w-full" disabled={form.busy}>Send code</Button>
					</Field>
				</FieldGroup>
			</form>
		</Card.Content>
	</Card.Root>
{:else}
	<Card.Root class="mx-auto w-full max-w-sm">
		<Card.Header>
			<Card.Title class="text-2xl">Choose a new password</Card.Title>
			<Card.Description class="text-balance">
				{`We sent a code to ${form.step.email}. Enter it below along with your new password. The code is valid for 5 minutes.`}
			</Card.Description>
		</Card.Header>
		<Card.Content>
			<form onsubmit={form.onResetSubmit}>
				<FieldGroup>
					<Field>
						<FieldLabel for="pr-code-{id}">Code</FieldLabel>
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
						<FieldDescription>Enter the 8-digit code from your email.</FieldDescription>
						{#if form.fieldErrors.code}
							<FieldError>{form.fieldErrors.code}</FieldError>
						{/if}
					</Field>

					<FormField id="pr-new-pw-{id}" label="New password" error={form.fieldErrors.newPassword}>
						<PasswordInput
							id="pr-new-pw-{id}"
							name="newPassword"
							autocomplete="new-password"
							bind:value={form.newPassword}
							aria-invalid={form.fieldErrors.newPassword ? 'true' : undefined}
						/>
					</FormField>

					<FormField
						id="pr-confirm-pw-{id}"
						label="Confirm new password"
						error={form.fieldErrors.confirmPassword}
					>
						<PasswordInput
							id="pr-confirm-pw-{id}"
							autocomplete="new-password"
							bind:value={form.confirmPassword}
							aria-invalid={form.fieldErrors.confirmPassword ? 'true' : undefined}
						/>
					</FormField>

					<input type="hidden" name="email" value={form.step.email} />
					<input type="hidden" name="flow" value="reset-verification" />

					{#if form.errorMessage}
						<FieldError>{form.errorMessage}</FieldError>
					{/if}

					<Field>
						<Button type="submit" class="w-full" disabled={form.busy}>Continue</Button>
						<Button
							type="button"
							variant="outline"
							class="w-full"
							disabled={form.busy}
							onclick={form.backToForgot}
						>
							Cancel
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
