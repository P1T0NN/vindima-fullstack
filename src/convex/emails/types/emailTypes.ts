export type EmailOTPType = 'sign-in' | 'change-email' | 'email-verification' | 'forget-password';

export type EmailRecipient = string | string[];

export type OtpEmailData = {
	email: string;
	otp: string;
	type: EmailOTPType;
};

export type SendEmailOptions = {
	to: EmailRecipient;
	subject: string;
	content: string;
	text?: string;
	previewText?: string;
};
