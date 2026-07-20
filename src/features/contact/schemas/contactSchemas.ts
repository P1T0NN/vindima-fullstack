// LIBRARIES
import { z } from 'zod';

export const sendContactFormEmailSchema = z.object({
	name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
	email: z.string().email('Introduce una dirección de correo electrónico válida'),
	message: z.string().min(10, 'El mensaje debe tener al menos 10 caracteres'),
	// Honeypot — invisible field hidden from real users via CSS. Bots that
	// auto-fill every input will leave a non-empty value and get rejected.
	website: z.literal('').optional()
});

export type SendContactFormEmailSchema = z.infer<typeof sendContactFormEmailSchema>;
