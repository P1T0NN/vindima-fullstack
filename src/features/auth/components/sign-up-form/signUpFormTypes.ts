import type { HTMLFormAttributes } from 'svelte/elements';

import type { WithElementRef } from '@/utils/utils.js';

/** Shown when email verification (OTP) is required after the first password sign-up. */
export type SignUpFormVerification = { email: string };

export type SignUpFormStep = 'signUp' | SignUpFormVerification;

/** Root `<form>` props for `sign-up-form-with-image` (class, `bind:ref`, `onsubmit`, etc.). */
export type SignUpFormWithImageProps = WithElementRef<HTMLFormAttributes>;

/** Names of validatable inputs in the sign-up forms. */
export type SignUpField = 'name' | 'email' | 'password' | 'confirmPassword';

/** Names of validatable inputs on the sign-up page (club layout). */
export type SignUpPageField =
	| 'firstName'
	| 'lastName'
	| 'email'
	| 'password'
	| 'confirmPassword'
	| 'phone'
	| 'birthday';
