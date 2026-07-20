// LIBRARIES
import { z } from 'zod';
import { isDeniedPassword } from '@/features/auth/utils/denyPasswordList.js';

const code8Digit = /^\d{8}$/u;

export const passwordResetRequestFormSchema = z.object({
	email: z.string().trim().min(1, 'Enter your email.').email('Invalid email.'),
	flow: z.literal('reset')
});

export const passwordResetVerifyFormSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'Enter the code.')
		.regex(code8Digit, 'Use the 8-digit code from your email.'),
	newPassword: z
		.string()
		.min(1, 'Enter a new password.')
		.min(8, 'At least 8 characters.')
		.refine(
			(input) => !isDeniedPassword(input),
			'That password is too common. Please choose a stronger one.'
		),
	email: z.string().trim().email('Invalid email.'),
	flow: z.literal('reset-verification')
});
