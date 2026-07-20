// LIBRARIES
import { z } from 'zod';

export const loginFormSchema = z.object({
	email: z.string().trim().min(1, 'Enter your email.').email('Invalid email.'),
	password: z.string().min(1, 'Enter your password.').min(8, 'At least 8 characters.'),
	flow: z.literal('signIn')
});
