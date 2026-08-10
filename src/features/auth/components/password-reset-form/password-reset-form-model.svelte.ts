// LIBRARIES
import { tick } from 'svelte';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

// UTILS
import { appGoto } from '@/utils/app-navigation.js';
import { authClient } from '@/features/auth/lib/auth-client';
import { passwordResetRequestSchema } from '@/shared/features/auth/schemas/passwordResetRequestSchema.js';
import { passwordResetVerifySchema } from '@/shared/features/auth/schemas/passwordResetVerifySchema.js';
import { zodIssuesToFieldErrors } from '@/features/validations/utils/fieldErrors';
import { rateLimitMessage } from '@/features/validations/utils/translateFromBackend';

// TYPES
import type { PasswordResetFormStep, PasswordResetField } from './passwordResetFormTypes.js';
import type { FieldErrors } from '@/shared/features/validations/types/validationsTypes';

// Wait for aria-invalid to hit the DOM, then move focus to the first bad field.
async function focusFirstInvalid() {
	await tick();
	document.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
}

export function createPasswordResetForm() {
	let step = $state<PasswordResetFormStep>('forgot');
	let busy = $state(false);
	let errorMessage = $state<string | null>(null);
	let fieldErrors = $state<FieldErrors<PasswordResetField>>({});
	let emailDraft = $state('');
	let newPassword = $state('');
	let confirmPassword = $state('');

	async function onForgotSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const p = passwordResetRequestSchema.safeParse({
			email: String(formData.get('email') ?? ''),
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<PasswordResetField>(p.error.issues);
			errorMessage = null;
			await focusFirstInvalid();
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		const normalizedEmail = p.data.email;
		try {
			// Anti-enumeration: ignore the result. The UI always advances to the reset
			// step regardless of whether this email is registered.
			await authClient.emailOtp.requestPasswordReset({ email: normalizedEmail });
		} catch (error) {
			console.error('Password reset: send code (outcome hidden from user):', error);
		} finally {
			emailDraft = normalizedEmail;
			step = { email: normalizedEmail };
			busy = false;
		}
	}

	async function onResetSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;
		if (step === 'forgot') return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const p = passwordResetVerifySchema.safeParse({
			code: String(formData.get('code') ?? '').trim(),
			newPassword: String(formData.get('newPassword') ?? ''),
			confirmPassword,
			email: step.email,
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<PasswordResetField>(p.error.issues);
			errorMessage = null;
			await focusFirstInvalid();
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		try {
			const { error } = await authClient.emailOtp.resetPassword({
				email: p.data.email,
				otp: p.data.code,
				password: p.data.newPassword
			});
			if (error) {
				console.error('Password reset: verification failed:', error);
				if (/password/i.test(error.message ?? '')) {
					fieldErrors = {
						newPassword: error.message ?? 'Código inválido o expirado. Inténtalo de nuevo.'
					};
				} else {
					errorMessage = rateLimitMessage(
						error.message,
						'Código inválido o expirado. Inténtalo de nuevo.'
					);
				}
				busy = false;
				return;
			}
		} catch (error) {
			console.error('Password reset: verification failed:', error);
			errorMessage = 'Código inválido o expirado. Inténtalo de nuevo.';
			busy = false;
			return;
		}

		await appGoto(UNPROTECTED_PAGE_ENDPOINTS.ROOT);
		busy = false;
	}

	function backToForgot() {
		step = 'forgot';
		newPassword = '';
		confirmPassword = '';
		errorMessage = null;
		fieldErrors = {};
	}

	return {
		get step() {
			return step;
		},
		get busy() {
			return busy;
		},
		set busy(v: boolean) {
			busy = v;
		},
		get errorMessage() {
			return errorMessage;
		},
		set errorMessage(v: string | null) {
			errorMessage = v;
		},
		get fieldErrors() {
			return fieldErrors;
		},
		get emailDraft() {
			return emailDraft;
		},
		set emailDraft(v: string) {
			emailDraft = v;
		},
		get newPassword() {
			return newPassword;
		},
		set newPassword(v: string) {
			newPassword = v;
		},
		get confirmPassword() {
			return confirmPassword;
		},
		set confirmPassword(v: string) {
			confirmPassword = v;
		},
		onForgotSubmit,
		onResetSubmit,
		backToForgot
	};
}
