// LIBRARIES
import { z } from 'zod';
import { isDeniedPassword } from '@/features/auth/utils/denyPasswordList.js';

export const signUpFormSchema = z.object({
	name: z.string().trim().min(1, 'Ingresa tu nombre completo.'),
	email: z.string().trim().min(1, 'Ingresa tu correo electrónico.').email('Correo electrónico no válido.'),
	password: z
		.string()
		.min(1, 'Ingresa tu contraseña.')
		.min(8, 'Mínimo 8 caracteres.')
		.refine(
			(input) => !isDeniedPassword(input),
			'Esa contraseña es muy común. Elige una más segura.'
		),
	confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
	flow: z.literal('signUp')
});

export const signUpPageSchema = z.object({
	firstName: z.string().trim().min(1, 'Ingresa tu nombre.'),
	lastName: z.string().trim().min(1, 'Ingresa tu apellido.'),
	email: z.string().trim().min(1, 'Ingresa tu correo electrónico.').email('Correo electrónico no válido.'),
	password: z
		.string()
		.min(1, 'Ingresa tu contraseña.')
		.min(8, 'Mínimo 8 caracteres.')
		.refine(
			(input) => !isDeniedPassword(input),
			'Esa contraseña es muy común. Elige una más segura.'
		),
	confirmPassword: z.string().min(1, 'Confirma tu contraseña.'),
	phone: z
		.string()
		.trim()
		.transform((value) => (value.length > 0 ? value : undefined))
		.optional(),
	birthday: z.string().trim().min(1, 'Ingresa tu cumpleaños.'),
	flow: z.literal('signUp')
});
