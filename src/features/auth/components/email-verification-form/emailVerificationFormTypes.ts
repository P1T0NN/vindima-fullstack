/** Names of validatable inputs in the email-verification form. */
export type EmailVerificationField = 'code';

/** Better-auth emailOTP types. */
export type EmailOtpType = 'sign-in' | 'email-verification' | 'forget-password';

/** What to send when the user taps "Resend". */
export type EmailVerificationResendConfig = {
	email: string;
	type: EmailOtpType;
};
