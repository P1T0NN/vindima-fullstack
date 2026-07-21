// UTILS
import { slugify } from '@/shared/utils/slugify';

/**
 * Suggested variant reference: product slug (+ slugified label when present).
 * Admins rarely understand opaque codes — the forms auto-fill this and stop the moment
 * they type their own. Uniqueness is still enforced server-side (`by_ref`).
 */
export function suggestVariantRef(productSlug: string, label: string | undefined): string {
	const base = slugify(productSlug);
	const labelSlug = slugify(label ?? '');
	return labelSlug ? `${base}-${labelSlug}` : base;
}
