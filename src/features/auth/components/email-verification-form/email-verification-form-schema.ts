// LIBRARIES
import { z } from 'zod';

const code8Digit = /^\d{8}$/u;

export const emailVerificationFormSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'Ingresa el código.')
		.regex(code8Digit, 'Usa el código de 8 dígitos que te enviamos por correo.'),
	email: z.string().trim().email('Correo electrónico no válido.'),
	flow: z.literal('email-verification')
});
