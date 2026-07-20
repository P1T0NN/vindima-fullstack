// LIBRARIES
import { z } from 'zod';

export const loginFormSchema = z.object({
	email: z.string().trim().min(1, 'Ingresa tu correo electrónico.').email('Correo electrónico no válido.'),
	password: z.string().min(1, 'Ingresa tu contraseña.').min(8, 'Mínimo 8 caracteres.'),
	flow: z.literal('signIn')
});
