/**
 * Lowercased passwords from public breach corpora (top entries).
 * Used server-side in Convex Auth and client-side in Zod forms.
 */
const DENIED_PASSWORDS: ReadonlySet<string> = new Set([
	'123456',
	'123456789',
	'12345678',
	'12345',
	'1234567',
	'1234567890',
	'qwerty',
	'qwerty123',
	'qwertyuiop',
	'qwerty1234',
	'password',
	'password1',
	'password123',
	'passw0rd',
	'p@ssw0rd',
	'admin',
	'admin123',
	'administrator',
	'letmein',
	'welcome',
	'welcome1',
	'iloveyou',
	'monkey',
	'dragon',
	'sunshine',
	'princess',
	'football',
	'baseball',
	'master',
	'shadow',
	'superman',
	'batman',
	'trustno1',
	'abc123',
	'abc12345',
	'abcdefg',
	'abcdef',
	'00000000',
	'11111111',
	'12121212',
	'aaaaaaaa',
	'qazwsx',
	'qazwsxedc',
	'zaq12wsx',
	'1q2w3e4r',
	'1qaz2wsx',
	'asdfghjkl',
	'asdfgh',
	'changeme',
	'starwars'
]);

/** True if the password (compared case-insensitively) is on the deny list. */
export function isDeniedPassword(password: string): boolean {
	return DENIED_PASSWORDS.has(password.toLowerCase());
}
