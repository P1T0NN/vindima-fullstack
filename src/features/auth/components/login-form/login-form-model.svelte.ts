// LIBRARIES
import { toast } from 'svelte-sonner';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

// UTILS
import { appGoto } from '@/utils/app-navigation.js';
import { authClient } from '@/features/auth/lib/auth-client';
import { loginFormSchema } from './login-form-schema.js';
import { zodIssuesToFieldErrors } from '@/shared/utils/validationUtils.js';
import { rateLimitMessage } from '@/shared/utils/rateLimitMessages';

// TYPES
import type { LoginFormStep, LoginField } from './loginFormTypes.js';
import type { FieldErrors } from '@/shared/types/types';

export type LoginFormCopy = {
	signInFailed: () => string;
	signedInToast: () => string;
};

export function createLoginForm(copy: LoginFormCopy) {
	let step = $state<LoginFormStep>('signIn');
	let busy = $state(false);
	let errorMessage = $state<string | null>(null);
	let fieldErrors = $state<FieldErrors<LoginField>>({});
	let emailDraft = $state('');
	let verifyContext = $state<{ email: string; password: string } | null>(null);

	async function onSignInSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const p = loginFormSchema.safeParse({
			email: String(formData.get('email') ?? ''),
			password: String(formData.get('password') ?? ''),
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<LoginField>(p.error.issues);
			errorMessage = null;
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		try {
			const { error } = await authClient.signIn.email({
				email: p.data.email,
				password: p.data.password
			});
			if (error) {
				const code = (error as { code?: string }).code ?? '';
				if (code === 'EMAIL_NOT_VERIFIED') {
					await authClient.emailOtp.sendVerificationOtp({
						email: p.data.email,
						type: 'email-verification'
					});
					emailDraft = p.data.email;
					verifyContext = { email: p.data.email, password: p.data.password };
					step = { email: p.data.email };
					return;
				}
				console.error('Login: sign in failed:', error);
				errorMessage = rateLimitMessage(error.message, copy.signInFailed());
				return;
			}
			await onVerifySuccess();
		} catch (error) {
			console.error('Login: sign in failed:', error);
			errorMessage = copy.signInFailed();
		} finally {
			busy = false;
		}
	}

	function onCancel() {
		step = 'signIn';
		verifyContext = null;
		errorMessage = null;
		fieldErrors = {};
	}

	async function onVerifySuccess() {
		toast.success(copy.signedInToast());
		await appGoto(UNPROTECTED_PAGE_ENDPOINTS.ROOT);
	}

	return {
		get step() {
			return step;
		},
		get busy() {
			return busy;
		},
		get errorMessage() {
			return errorMessage;
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
		get verifyContext() {
			return verifyContext;
		},
		onSignInSubmit,
		onCancel,
		onVerifySuccess
	};
}
