<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Card } from '@/components/ui/card/index.js';
	import { Input } from '@/components/ui/input/index.js';
	import { BirthdayInput } from '@/components/ui/birthday-input/index.js';
	import { Label } from '@/components/ui/label/index.js';
	import Link from '@/components/ui/link/link.svelte';
	import Logo from '@/components/ui/logo/logo.svelte';
	import Section from '@/components/ui/section/section.svelte';
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import GoogleLoginButton from '@/features/auth/components/google-login-button/google-login-button.svelte';
	import PasswordInput from '@/features/auth/components/password-input/password-input.svelte';
	import EmailVerificationForm from '@/features/auth/components/email-verification-form/email-verification-form.svelte';
	import { FieldError } from '@/components/ui/field/index.js';
	import { createSignUpPageForm } from '@/features/auth/components/sign-up-form/sign-up-form-model.svelte.js';

	const id = $props.id();

	const benefits = [
		() => '10% de descuento en toda la tienda',
		() => 'Regalo de cumpleaños',
		() => '5 compras = 1 recompensa',
		() => 'Maridajes pensados para tu mesa'
	] as const;

	const form = createSignUpPageForm({
		signUpFailed: () =>
			'No pudimos crear tu cuenta. Revisa tus datos e inténtalo de nuevo, o inicia sesión si ya tienes una.',
		accountCreatedToast: () => 'Cuenta creada correctamente.'
	});
</script>

<SvelteHead
	title="Crear cuenta"
	noindex
	description="Únete al club Vindima para obtener recompensas, ahorros para miembros y maridajes pensados para tu mesa."
/>

<Section yPadding="none" class="bg-secondary py-16 pb-24 sm:pb-28">
	<Card
		class="grid gap-0 overflow-hidden rounded-xl border-0 p-0 shadow-brand-elevated lg:grid-cols-2"
	>
		<div
			class="flex flex-col justify-center bg-accent px-8 py-12 text-accent-surface-muted sm:px-11"
		>
			<Logo size="lg" class="mb-8 self-start" />

			<p class="mb-3 text-xs font-medium tracking-widest text-primary uppercase">Membresía</p>
			<h1
				class="mb-6 font-display text-4xl leading-none font-semibold tracking-wide text-background uppercase"
			>
				Vindima Club
			</h1>

			<ul class="flex flex-col gap-4">
				{#each benefits as benefit (benefit())}
					<li class="flex items-start gap-3 text-sm leading-snug">
						<span class="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden="true"
						></span>
						{benefit()}
					</li>
				{/each}
			</ul>
		</div>

		<div class="bg-card px-8 py-12 sm:px-11">
			{#if form.step === 'signUp'}
				<h2 class="mb-1.5 font-display text-3xl font-semibold tracking-wide text-accent uppercase">
					Crear mi cuenta
				</h2>
				<p class="mb-6 text-sm leading-relaxed text-muted-foreground">
					Regístrate en un minuto y empieza a ganar recompensas.
				</p>

				<form class="flex flex-col gap-4" onsubmit={form.onSignUpSubmit}>
					<div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
						<div class="flex flex-col gap-1.5">
							<Label
								for="signup-first-name-{id}"
								class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								Nombre
							</Label>
							<Input
								id="signup-first-name-{id}"
								name="firstName"
								type="text"
								autocomplete="given-name"
								placeholder="Mariana"
								autofocus
								aria-invalid={form.fieldErrors.firstName ? 'true' : undefined}
								class="h-auto rounded-sm px-3 py-3"
							/>
							{#if form.fieldErrors.firstName}
								<FieldError>{form.fieldErrors.firstName}</FieldError>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5">
							<Label
								for="signup-last-name-{id}"
								class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								Apellido
							</Label>
							<Input
								id="signup-last-name-{id}"
								name="lastName"
								type="text"
								autocomplete="family-name"
								placeholder="Reyes"
								aria-invalid={form.fieldErrors.lastName ? 'true' : undefined}
								class="h-auto rounded-sm px-3 py-3"
							/>
							{#if form.fieldErrors.lastName}
								<FieldError>{form.fieldErrors.lastName}</FieldError>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5 sm:col-span-2">
							<Label
								for="signup-email-{id}"
								class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								Correo electrónico
							</Label>
							<Input
								id="signup-email-{id}"
								name="email"
								type="email"
								autocomplete="email"
								placeholder="mariana@email.com"
								bind:value={form.emailDraft}
								aria-invalid={form.fieldErrors.email ? 'true' : undefined}
								class="h-auto rounded-sm px-3 py-3"
							/>
							{#if form.fieldErrors.email}
								<FieldError>{form.fieldErrors.email}</FieldError>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5 sm:col-span-2">
							<Label
								for="signup-password-{id}"
								class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								Contraseña
							</Label>
							<PasswordInput
								id="signup-password-{id}"
								name="password"
								autocomplete="new-password"
								placeholder="••••••••"
								aria-invalid={form.fieldErrors.password ? 'true' : undefined}
								class="h-auto rounded-sm px-3 py-3"
							/>
							{#if form.fieldErrors.password}
								<FieldError>{form.fieldErrors.password}</FieldError>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5 sm:col-span-2">
							<Label
								for="signup-confirm-password-{id}"
								class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								Confirmar contraseña
							</Label>
							<PasswordInput
								id="signup-confirm-password-{id}"
								name="confirmPassword"
								autocomplete="new-password"
								placeholder="••••••••"
								aria-invalid={form.fieldErrors.confirmPassword ? 'true' : undefined}
								class="h-auto rounded-sm px-3 py-3"
							/>
							{#if form.fieldErrors.confirmPassword}
								<FieldError>{form.fieldErrors.confirmPassword}</FieldError>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5">
							<Label
								for="signup-phone-{id}"
								class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								Teléfono (opcional)
							</Label>
							<Input
								id="signup-phone-{id}"
								name="phone"
								type="tel"
								autocomplete="tel"
								placeholder="449 000 0000"
								aria-invalid={form.fieldErrors.phone ? 'true' : undefined}
								class="h-auto rounded-sm px-3 py-3"
							/>
							{#if form.fieldErrors.phone}
								<FieldError>{form.fieldErrors.phone}</FieldError>
							{/if}
						</div>

						<div class="flex flex-col gap-1.5">
							<Label
								for="signup-birthday-{id}"
								class="text-xs font-medium tracking-wide text-muted-foreground uppercase"
							>
								Cumpleaños (DD/MM)
							</Label>
							<BirthdayInput
								id="signup-birthday-{id}"
								name="birthday"
								placeholder="DD/MM"
								aria-invalid={form.fieldErrors.birthday ? 'true' : undefined}
								class="h-auto rounded-sm px-3 py-3"
							/>
							{#if form.fieldErrors.birthday}
								<FieldError>{form.fieldErrors.birthday}</FieldError>
							{/if}
						</div>
					</div>

					<input type="hidden" name="flow" value="signUp" />

					{#if form.errorMessage}
						<FieldError>{form.errorMessage}</FieldError>
					{/if}

					<Button
						type="submit"
						disabled={form.busy}
						class="mt-2 h-auto w-full justify-center px-6 py-3.5 text-sm tracking-wider uppercase"
					>
						Crear mi cuenta
					</Button>

					<div class="relative my-2">
						<div class="absolute inset-0 flex items-center" aria-hidden="true">
							<div class="w-full border-t border-border"></div>
						</div>
						<p
							class="relative mx-auto w-fit bg-card px-3 text-xs tracking-wide text-muted-foreground uppercase"
						>
							O continúa con
						</p>
					</div>

					<GoogleLoginButton
						class="h-auto w-full justify-center px-6 py-3.5 text-sm tracking-wider uppercase"
					/>

					<p class="text-center text-xs leading-snug text-muted-foreground/80">
						¿Ya eres miembro?
						<Link
							href={UNPROTECTED_PAGE_ENDPOINTS.LOGIN}
							class="text-chart-2 no-underline hover:underline"
						>
							Iniciar sesión
						</Link>
					</p>
				</form>
			{:else}
				<EmailVerificationForm
					email={form.step.email}
					onCancel={form.onCancel}
					onSuccess={form.onVerifySuccess}
					resend={form.verifyContext
						? { email: form.verifyContext.email, type: 'email-verification' }
						: undefined}
				/>
			{/if}
		</div>
	</Card>
</Section>
