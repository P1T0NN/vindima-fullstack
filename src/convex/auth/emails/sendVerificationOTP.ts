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
		'sign-in': `Inicia sesión en ${COMPANY_DATA.NAME}`,
		'email-verification': `Verifica tu correo electrónico en ${COMPANY_DATA.NAME}`,
		'forget-password': `Restablece tu contraseña de ${COMPANY_DATA.NAME}`,
		'change-email': `Confirma tu nuevo correo electrónico en ${COMPANY_DATA.NAME}`
	};

	const { error } = await resend.emails.send({
		from: `${COMPANY_DATA.NAME} <${COMPANY_DATA.RESEND_EMAIL}>`,
		to: [email],
		subject: subjects[type],
		text: `Tu código es ${otp}`
	});
	if (error) throw new Error('No se pudo enviar el correo de verificación');
}
