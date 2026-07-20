// LIBRARIES
import { toast } from 'svelte-sonner';

// CONFIG
import { UNPROTECTED_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

// UTILS
import { appGoto } from '@/utils/app-navigation.js';
import { authClient } from '@/features/auth/lib/auth-client';
import { signUpFormSchema, signUpPageSchema } from './sign-up-form-schema.js';
import { zodIssuesToFieldErrors } from '@/shared/utils/validationUtils.js';
import { rateLimitMessage } from '@/shared/utils/rateLimitMessages';

// TYPES
import type { SignUpFormStep, SignUpField, SignUpPageField } from './signUpFormTypes.js';
import type { FieldErrors } from '@/shared/types/types';

export type SignUpFormCopy = {
	signUpFailed: () => string;
	accountCreatedToast: () => string;
};

export function createSignUpForm(copy: SignUpFormCopy) {
	let step = $state<SignUpFormStep>('signUp');
	let busy = $state(false);
	let errorMessage = $state<string | null>(null);
	let fieldErrors = $state<FieldErrors<SignUpField>>({});
	let nameDraft = $state('');
	let emailDraft = $state('');
	let verifyContext = $state<{ name: string; email: string; password: string } | null>(null);

	async function onSignUpSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const p = signUpFormSchema.safeParse({
			name: String(formData.get('name') ?? ''),
			email: String(formData.get('email') ?? ''),
			password: String(formData.get('password') ?? ''),
			confirmPassword: String(formData.get('confirmPassword') ?? ''),
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<SignUpField>(p.error.issues);
			errorMessage = null;
			return;
		}

		if (p.data.password !== p.data.confirmPassword) {
			fieldErrors = { confirmPassword: 'Passwords must match.' };
			errorMessage = null;
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		try {
			const { error } = await authClient.signUp.email({
				name: p.data.name,
				email: p.data.email,
				password: p.data.password
			});

			if (error) {
				console.error('Sign up failed:', error);
				if (/password/i.test(error.message ?? '')) {
					fieldErrors = { password: error.message ?? copy.signUpFailed() };
				} else {
					errorMessage = rateLimitMessage(error.message, copy.signUpFailed());
				}
				return;
			}

			nameDraft = p.data.name;
			emailDraft = p.data.email;
			verifyContext = {
				name: p.data.name,
				email: p.data.email,
				password: p.data.password
			};
			step = { email: p.data.email };
		} catch (error) {
			console.error('Sign up failed:', error);
			errorMessage = copy.signUpFailed();
		} finally {
			busy = false;
		}
	}

	function onCancel() {
		step = 'signUp';
		verifyContext = null;
		errorMessage = null;
		fieldErrors = {};
	}

	async function onVerifySuccess() {
		toast.success(copy.accountCreatedToast());
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
		get nameDraft() {
			return nameDraft;
		},
		set nameDraft(v: string) {
			nameDraft = v;
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
		onSignUpSubmit,
		onCancel,
		onVerifySuccess
	};
}

export function createSignUpPageForm(copy: SignUpFormCopy) {
	let step = $state<SignUpFormStep>('signUp');
	let busy = $state(false);
	let errorMessage = $state<string | null>(null);
	let fieldErrors = $state<FieldErrors<SignUpPageField>>({});
	let emailDraft = $state('');
	let verifyContext = $state<{ name: string; email: string; password: string } | null>(null);

	async function onSignUpSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (busy) return;

		const form = event.currentTarget as HTMLFormElement;
		const formData = new FormData(form);

		const p = signUpPageSchema.safeParse({
			firstName: String(formData.get('firstName') ?? ''),
			lastName: String(formData.get('lastName') ?? ''),
			email: String(formData.get('email') ?? ''),
			password: String(formData.get('password') ?? ''),
			confirmPassword: String(formData.get('confirmPassword') ?? ''),
			phone: String(formData.get('phone') ?? ''),
			birthday: String(formData.get('birthday') ?? ''),
			flow: String(formData.get('flow') ?? '')
		});

		if (!p.success) {
			fieldErrors = zodIssuesToFieldErrors<SignUpPageField>(p.error.issues);
			errorMessage = null;
			return;
		}

		if (p.data.password !== p.data.confirmPassword) {
			fieldErrors = { confirmPassword: 'Passwords must match.' };
			errorMessage = null;
			return;
		}

		fieldErrors = {};
		busy = true;
		errorMessage = null;

		const name = `${p.data.firstName} ${p.data.lastName}`.trim();

		try {
			const { error } = await authClient.signUp.email({
				name,
				email: p.data.email,
				password: p.data.password,
				...(p.data.phone ? { phone: p.data.phone } : {}),
				birthday: p.data.birthday
			});

			if (error) {
				console.error('Sign up failed:', error);
				if (/password/i.test(error.message ?? '')) {
					fieldErrors = { password: error.message ?? copy.signUpFailed() };
				} else {
					errorMessage = rateLimitMessage(error.message, copy.signUpFailed());
				}
				return;
			}

			emailDraft = p.data.email;
			verifyContext = {
				name,
				email: p.data.email,
				password: p.data.password
			};
			step = { email: p.data.email };
		} catch (error) {
			console.error('Sign up failed:', error);
			errorMessage = copy.signUpFailed();
		} finally {
			busy = false;
		}
	}

	function onCancel() {
		step = 'signUp';
		verifyContext = null;
		errorMessage = null;
		fieldErrors = {};
	}

	async function onVerifySuccess() {
		toast.success(copy.accountCreatedToast());
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
		onSignUpSubmit,
		onCancel,
		onVerifySuccess
	};
}
