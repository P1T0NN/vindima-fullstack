/** OTP + new-password step (after the user requests a reset link/code). */
export type PasswordResetVerifyStep = { email: string };

export type PasswordResetFormStep = 'forgot' | PasswordResetVerifyStep;

/** Names of validatable inputs in the password-reset form. */
export type PasswordResetField = 'email' | 'code' | 'newPassword' | 'confirmPassword';
