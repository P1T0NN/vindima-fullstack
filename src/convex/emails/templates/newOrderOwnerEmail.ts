// UTILS
import { formatMoneyMinor } from '@/utils/formatters';

// LAYOUT
import { renderEmail, h1, p, panel, button, siteUrl, esc } from './emailLayout';
import { orderSummaryRows, orderSummaryText, fulfillmentText } from './orderSummaryTable';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

/**
 * S1 — new paid order, to the store owner (`EmailSystemDesign.md` §5 S1). No greeting, no
 * prose: everything needed to act in 5 seconds behind a counter — who, how they get it, what
 * they bought, total, and a link to admin.
 */
export function newOrderOwnerEmail(order: Doc<'orders'>): EmailContent {
	const total = formatMoneyMinor(order.amounts.totalMinor, order.currency);
	const contact = [order.name, order.phone, order.email]
		.filter((s): s is string => !!s)
		.map(esc)
		.join(' · ');
	const fulfillment =
		order.delivery.kind === 'pickup'
			? 'Recoger en tienda'
			: [
					'Envío a domicilio',
					order.delivery.address.line1,
					order.delivery.address.line2,
					`${order.delivery.address.postcode} ${order.delivery.address.city}`,
					order.delivery.address.country
				]
					.filter((s): s is string => !!s)
					.map(esc)
					.join(', ');

	const bodyHtml =
		h1(`Nuevo pedido ${esc(order.number)}`) +
		panel(
			`<p style="margin:0 0 6px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1c1418;"><strong>Cliente:</strong> ${contact}</p>` +
				`<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1c1418;"><strong>Entrega:</strong> ${fulfillment}</p>` +
				orderSummaryRows(order)
		) +
		(order.note ? p(`<strong>Nota:</strong> ${esc(order.note)}`, true) : '') +
		button('Abrir admin', siteUrl('/admin/orders'));

	const html = renderEmail(`${order.name} · ${total}`, bodyHtml);

	const text = [
		`Nuevo pedido ${order.number} — ${total}`,
		'',
		`Cliente: ${[order.name, order.phone, order.email].filter(Boolean).join(' · ')}`,
		`Entrega: ${fulfillmentText(order)}`,
		'',
		orderSummaryText(order),
		order.note ? `\nNota: ${order.note}` : '',
		'',
		`Admin: ${siteUrl('/admin/orders')}`
	]
		.filter(Boolean)
		.join('\n');

	return { subject: `Nuevo pedido ${order.number} — ${total}`, html, text };
}
