// LIBRARIES
import { z } from 'zod';

export const sendContactFormEmailSchema = z.object({
	name: z.string().min(3, 'Name must be at least 3 characters'),
	email: z.string().email('Please enter a valid email address'),
	message: z.string().min(10, 'Message must be at least 10 characters'),
	// Honeypot — invisible field hidden from real users via CSS. Bots that
	// auto-fill every input will leave a non-empty value and get rejected.
	website: z.literal('').optional()
});

export type SendContactFormEmailSchema = z.infer<typeof sendContactFormEmailSchema>;
