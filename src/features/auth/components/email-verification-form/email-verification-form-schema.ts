// LIBRARIES
import { z } from 'zod';

const code8Digit = /^\d{8}$/u;

export const emailVerificationFormSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'Enter the code.')
		.regex(code8Digit, 'Use the 8-digit code from your email.'),
	email: z.string().trim().email('Invalid email.'),
	flow: z.literal('email-verification')
});
