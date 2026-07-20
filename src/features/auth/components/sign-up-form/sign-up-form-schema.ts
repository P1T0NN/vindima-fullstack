// LIBRARIES
import { z } from 'zod';
import { isDeniedPassword } from '@/features/auth/utils/denyPasswordList.js';

export const signUpFormSchema = z.object({
	name: z.string().trim().min(1, 'Enter your full name.'),
	email: z.string().trim().min(1, 'Enter your email.').email('Invalid email.'),
	password: z
		.string()
		.min(1, 'Enter your password.')
		.min(8, 'At least 8 characters.')
		.refine(
			(input) => !isDeniedPassword(input),
			'That password is too common. Please choose a stronger one.'
		),
	confirmPassword: z.string().min(1, 'Confirm your password.'),
	flow: z.literal('signUp')
});

export const signUpPageSchema = z.object({
	firstName: z.string().trim().min(1, 'Enter your first name.'),
	lastName: z.string().trim().min(1, 'Enter your last name.'),
	email: z.string().trim().min(1, 'Enter your email.').email('Invalid email.'),
	password: z
		.string()
		.min(1, 'Enter your password.')
		.min(8, 'At least 8 characters.')
		.refine(
			(input) => !isDeniedPassword(input),
			'That password is too common. Please choose a stronger one.'
		),
	confirmPassword: z.string().min(1, 'Confirm your password.'),
	phone: z
		.string()
		.trim()
		.transform((value) => (value.length > 0 ? value : undefined))
		.optional(),
	birthday: z.string().trim().min(1, 'Enter your birthday.'),
	flow: z.literal('signUp')
});
