// CONFIG
import { EMAIL_CONFIG } from '@/shared/config.js';

// UTILS
import { formatMoneyMinor } from '@/utils/formatters';

// LAYOUT
import { esc } from './emailLayout';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';

/**
 * Shared order-summary blocks (see `EmailSystemDesign.md` §6). The full breakdown must
 * match the checkout screen number-for-number — same one-honest-number principle. Written
 * ONCE here; O1/O2/S1 use the full breakdown, O5/O6 use the compact line list.
 *
 * Pure `(order) => string`. Each block returns HTML meant to sit inside a `panel()`, plus a
 * `*Text` twin for the plain-text alternative.
 */

const SANS = 'Arial,Helvetica,sans-serif';

/** One `label / value` row inside the summary, right-aligned value. `strong` for the total. */
function row(
	label: string,
	value: string,
	opts: { strong?: boolean; muted?: boolean } = {}
): string {
	const weight = opts.strong ? 'bold' : 'normal';
	const color = opts.muted ? EMAIL_CONFIG.MUTED_TEXT : EMAIL_CONFIG.TEXT;
	const size = opts.strong ? '16px' : '14px';
	return `<tr>
  <td style="padding:4px 0;font-family:${SANS};font-size:${size};color:${color};font-weight:${weight};">${label}</td>
  <td align="right" style="padding:4px 0;font-family:${SANS};font-size:${size};color:${color};font-weight:${weight};white-space:nowrap;">${value}</td>
</tr>`;
}

/** Shipping label mirrors checkout: pickup = free counter pickup; delivery = fee or "Gratis". */
function shippingLabel(order: Doc<'orders'>): string {
	if (order.delivery.kind === 'pickup') return 'Recoger en tienda — sin costo';
	if (order.amounts.shippingMinor === 0) return 'Gratis';
	return formatMoneyMinor(order.amounts.shippingMinor, order.currency);
}

/** Full line items + price breakdown (subtotal, discounts as named lines, shipping, total). */
export function orderSummaryRows(order: Doc<'orders'>): string {
	const lineRows = order.lines
		.map((l) => {
			const name = `${esc(l.name)} <span style="color:${EMAIL_CONFIG.MUTED_TEXT};">× ${l.qty}</span>`;
			const value = l.isRewardLine
				? 'Gratis'
				: formatMoneyMinor(l.unitPriceMinor * l.qty, order.currency);
			return row(name, value);
		})
		.join('');

	const divider = `<tr><td colspan="2" style="padding:8px 0;"><div style="border-top:1px solid ${EMAIL_CONFIG.MUTED_TEXT};opacity:0.2;font-size:0;line-height:0;">&nbsp;</div></td></tr>`;

	const breakdown = [
		row('Subtotal', formatMoneyMinor(order.amounts.subtotalMinor, order.currency), { muted: true }),
		order.amounts.welcomeDiscountMinor > 0
			? row(
					'Oferta de bienvenida',
					`−${formatMoneyMinor(order.amounts.welcomeDiscountMinor, order.currency)}`,
					{ muted: true }
				)
			: '',
		order.lines.some((l) => l.isRewardLine)
			? row('Recompensa', 'Artículo gratis', { muted: true })
			: '',
		row('Envío', shippingLabel(order), { muted: true }),
		row('Total', formatMoneyMinor(order.amounts.totalMinor, order.currency), { strong: true })
	].join('');

	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${lineRows}${divider}${breakdown}</table>`;
}

/** Compact list — item names + qty only, no prices (for shipped/cancelled/expired). */
export function orderLinesRows(order: Doc<'orders'>): string {
	return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${order.lines
		.map((l) => row(esc(l.name), `× ${l.qty}`, { muted: true }))
		.join('')}</table>`;
}

/** Plain-text twin of the full breakdown. */
export function orderSummaryText(order: Doc<'orders'>): string {
	const lines = order.lines
		.map(
			(l) =>
				`  ${l.name} × ${l.qty} — ${
					l.isRewardLine ? 'Gratis' : formatMoneyMinor(l.unitPriceMinor * l.qty, order.currency)
				}`
		)
		.join('\n');
	const parts = [
		lines,
		`  Subtotal: ${formatMoneyMinor(order.amounts.subtotalMinor, order.currency)}`,
		order.amounts.welcomeDiscountMinor > 0
			? `  Oferta de bienvenida: −${formatMoneyMinor(order.amounts.welcomeDiscountMinor, order.currency)}`
			: '',
		`  Envío: ${shippingLabel(order)}`,
		`  Total: ${formatMoneyMinor(order.amounts.totalMinor, order.currency)}`
	].filter(Boolean);
	return parts.join('\n');
}

/** Plain-text twin of the compact line list. */
export function orderLinesText(order: Doc<'orders'>): string {
	return order.lines.map((l) => `  ${l.name} × ${l.qty}`).join('\n');
}

/** Delivery/pickup sub-block, HTML. Address as entered for delivery; pickup line otherwise. */
export function fulfillmentBlock(order: Doc<'orders'>): string {
	if (order.delivery.kind === 'pickup') {
		return `<p style="margin:0;font-family:${SANS};font-size:14px;color:${EMAIL_CONFIG.TEXT};"><strong>Recoger en tienda</strong></p>`;
	}
	const a = order.delivery.address;
	const lines = [a.line1, a.line2, `${a.postcode} ${a.city}`, a.country]
		.filter((s): s is string => !!s)
		.map(esc);
	return `<p style="margin:0;font-family:${SANS};font-size:14px;line-height:1.5;color:${EMAIL_CONFIG.TEXT};"><strong>Envío a domicilio</strong><br />${lines.join('<br />')}</p>`;
}

/** Plain-text twin of the fulfillment block. */
export function fulfillmentText(order: Doc<'orders'>): string {
	if (order.delivery.kind === 'pickup') return 'Recoger en tienda';
	const a = order.delivery.address;
	return ['Envío a domicilio:', a.line1, a.line2, `${a.postcode} ${a.city}`, a.country]
		.filter(Boolean)
		.join('\n');
}
