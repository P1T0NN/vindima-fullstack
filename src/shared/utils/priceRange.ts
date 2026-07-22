// UTILS
import { formatMoneyMinor } from '@/utils/formatters';

// CONFIG
import { CART_CONFIG } from '@/shared/config';

/**
 * Formats a product's variant price span as `"min – max"` (or a single price, or an em dash
 * when there are no variants). Money is integer minor units throughout.
 *
 * Universal — depends only on `Intl` (via `formatMoneyMinor`), so it imports cleanly from
 * BOTH Svelte and Convex code; keep price-range formatting here rather than duplicating it
 * per side. Pass an explicit `currency` (e.g. an order's snapshotted currency) or let it
 * default to the live cart currency.
 */
export function priceRange(
	variants: { priceMinor: number }[],
	currency: string = CART_CONFIG.CURRENCY
): string {
	if (variants.length === 0) return '—';
	const prices = variants.map((v) => v.priceMinor);
	const min = Math.min(...prices);
	const max = Math.max(...prices);
	const fmt = (n: number) => formatMoneyMinor(n, currency);
	return min === max ? fmt(min) : `${fmt(min)} – ${fmt(max)}`;
}
