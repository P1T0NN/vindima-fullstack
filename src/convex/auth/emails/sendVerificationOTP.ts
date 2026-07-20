// LIBRARIES
import { Resend as ResendAPI } from 'resend';

// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';

type OtpType = 'sign-in' | 'email-verification' | 'forget-password' | 'change-email';

export async function sendVerificationOTP({
	email,
	otp,
	type
}: {
	email: string;
	otp: string;
	type: OtpType;
}) {
	const apiKey = process.env.RESEND_API_KEY;
	if (!apiKey) throw new Error('RESEND_API_KEY is not set');
	const resend = new ResendAPI(apiKey);

	const subjects: Record<OtpType, string> = {
		'sign-in': `Sign in to ${COMPANY_DATA.NAME}`,
		'email-verification': `Verify your email for ${COMPANY_DATA.NAME}`,
		'forget-password': `Reset your ${COMPANY_DATA.NAME} password`,
		'change-email': `Confirm your new email for ${COMPANY_DATA.NAME}`
	};

	const { error } = await resend.emails.send({
		from: `${COMPANY_DATA.NAME} <${COMPANY_DATA.RESEND_EMAIL}>`,
		to: [email],
		subject: subjects[type],
		text: `Your code is ${otp}`
	});
	if (error) throw new Error('Could not send verification email');
}
