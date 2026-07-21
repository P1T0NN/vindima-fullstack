/**
 * Builds a stable, non-expiring HTTPS URL for an object in a **public** R2 bucket
 * (R2.dev subdomain or a custom domain).
 *
 * Set `R2_PUBLIC_BASE_URL` in the Convex dashboard (Settings → Environment Variables).
 * No trailing slash, e.g. `https://pub-c0fc3574f37d43b6944793bac1e6d018.r2.dev`.
 *
 * @returns `null` when unset — callers should fall back to a signed URL (temporary).
 */
export function buildR2PublicObjectUrl(key: string): string | null {
	const base = process.env.R2_PUBLIC_BASE_URL?.trim();
	if (!base) return null;

	const prefix = base.replace(/\/+$/, '');
	const path = key.split('/').filter(Boolean).map(encodeURIComponent).join('/');

	return `${prefix}/${path}`;
}
