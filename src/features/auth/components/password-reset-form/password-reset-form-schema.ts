// LIBRARIES
import { z } from 'zod';
import { isDeniedPassword } from '@/features/auth/utils/denyPasswordList.js';

const code8Digit = /^\d{8}$/u;

export const passwordResetRequestFormSchema = z.object({
	email: z.string().trim().min(1, 'Ingresa tu correo electrónico.').email('Correo electrónico no válido.'),
	flow: z.literal('reset')
});

export const passwordResetVerifyFormSchema = z.object({
	code: z
		.string()
		.trim()
		.min(1, 'Ingresa el código.')
		.regex(code8Digit, 'Usa el código de 8 dígitos que te enviamos por correo.'),
	newPassword: z
		.string()
		.min(1, 'Ingresa una nueva contraseña.')
		.min(8, 'Mínimo 8 caracteres.')
		.refine(
			(input) => !isDeniedPassword(input),
			'Esa contraseña es muy común. Elige una más segura.'
		),
	email: z.string().trim().email('Correo electrónico no válido.'),
	flow: z.literal('reset-verification')
});
