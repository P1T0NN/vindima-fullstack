/** Extract a normalized email from Better Auth hook bodies when present. */
export function getEmailFromAuthBody(body: unknown): string | null {
	if (!body || typeof body !== 'object' || !('email' in body)) return null;
	const email = (body as { email?: unknown }).email;
	if (typeof email !== 'string') return null;
	const normalized = email.trim().toLowerCase();
	return normalized.length > 0 ? normalized : null;
}
