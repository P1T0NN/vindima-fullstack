/**
 * Variant display-name composition — FRONTEND-ONLY (GeneralSystemDesignRule.md § backend
 * returns data, frontend renders display). Convex returns raw fields (`productName`,
 * `variantLabel`, refs); every screen composes what it shows through these helpers, so
 * display formatting — and future i18n — lives in exactly one client-side place.
 *
 * Convex must NEVER import this file. The one server-side composition that remains is the
 * order-line snapshot written at purchase time (a stored fact, like an invoice).
 */

/** `Paradoja Blanc` + `Botella` → `Paradoja Blanc · Botella`; no label → just the name. */
export function formatVariantName(productName: string, variantLabel?: string | null): string {
	return variantLabel ? `${productName} - ${variantLabel}` : productName;
}

/** 'boards-1-M' → 'Boards 1 M'. Readable fallback for a ref whose product no longer exists. */
export function titleCaseRef(ref: string): string {
	return ref
		.replace(/[-_]+/g, ' ')
		.trim()
		.replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * The one-liner every cart/upsell surface needs: compose the display name from raw resolved
 * fields, falling back to a readable ref when the product is gone.
 */
export function resolvedDisplayName(row: {
	productName: string | null;
	variantLabel: string | null;
	/** The ref, used only as the fallback base when `productName` is null. */
	ref: string;
}): string {
	return formatVariantName(row.productName ?? titleCaseRef(row.ref), row.variantLabel);
}
