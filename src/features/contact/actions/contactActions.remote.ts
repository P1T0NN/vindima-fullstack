// SVELTEKIT IMPORTS
import { RESEND_API_KEY } from '$env/static/private';

// LIBRARIES
import { Resend } from 'resend';

// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';

// UTILS
import { safeCommand } from '@/utils/remoteFunctionsUtils';
import { escapeHtml } from '@/shared/utils/escapeHtml.js';

// SCHEMAS
import { sendContactFormEmailSchema } from '@/features/contact/schemas/contactSchemas';

export const sendContactFormEmail = safeCommand(sendContactFormEmailSchema, async (data) => {
	const resend = new Resend(RESEND_API_KEY);

	const { error } = await resend.emails.send({
		from: `Website Contact Form <noreply@${COMPANY_DATA.DOMAIN}>`,
		to: [COMPANY_DATA.EMAIL],
		subject: 'Website contact form',
		html: `
			<p>Name: ${escapeHtml(data.name)}</p>
			<p>Email: ${escapeHtml(data.email)}</p>
			<p>Message: ${escapeHtml(data.message)}</p>
		`
	});

	if (error) {
		return { success: false, message: error.message, data: null };
	}

	return { success: true, message: 'Email sent successfully.', data: null };
});
