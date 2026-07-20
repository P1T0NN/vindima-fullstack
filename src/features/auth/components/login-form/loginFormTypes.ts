import type { HTMLFormAttributes } from 'svelte/elements';

import type { WithElementRef } from '@/utils/utils.js';

/** Shown when email verification (OTP) is required after the first password sign-in. */
export type LoginFormVerification = { email: string };

export type LoginFormStep = 'signIn' | LoginFormVerification;

/** Root `<form>` props for `login-form-with-image` (class, `bind:ref`, `onsubmit`, etc.). */
export type LoginFormWithImageProps = WithElementRef<HTMLFormAttributes>;

/** Names of validatable inputs in the login forms. */
export type LoginField = 'email' | 'password';
