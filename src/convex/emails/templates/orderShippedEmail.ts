// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';

// UTILS
import { formatMoneyMinor } from '@/utils/formatters';

// LAYOUT
import { renderEmail, h1, p, panel, firstName, esc } from './emailLayout';
import {
	orderLinesRows,
	orderLinesText,
	fulfillmentBlock,
	fulfillmentText
} from './orderSummaryTable';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

/**
 * O3 (delivery: "en camino") + O4 (pickup: "listo para recoger") — one admin action
 * (`fulfillment → 'shipped'`) drives both; the copy branches on `delivery.kind`
 * (`EmailSystemDesign.md` §5 O3/O4). No prices — the receipt already carried them.
 * Pickup makes the order number prominent (staff ask for it) + a pay-on-pickup reminder
 * when the order is still `pending`.
 */
export function orderShippedEmail(order: Doc<'orders'>): EmailContent {
	const hi = firstName(order.name);
	const greeting = hi ? `Hola ${esc(hi)}, ` : 'Hola, ';
	const isPickup = order.delivery.kind === 'pickup';

	if (isPickup) {
		const total = formatMoneyMinor(order.amounts.totalMinor, order.currency);
		const payReminder = order.status === 'pending' ? p(`Pagas al recoger — ${total}.`) : '';

		const bodyHtml =
			h1('Tu pedido está listo para recoger') +
			p(`${greeting}tu pedido ya te espera en la tienda.`) +
			panel(
				`<p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(28,20,24,0.6);">Número de pedido</p>` +
					`<p style="margin:0 0 16px;font-family:'Courier New',Courier,monospace;font-size:24px;font-weight:bold;color:#510128;">${esc(order.number)}</p>` +
					orderLinesRows(order)
			) +
			p('Menciona tu número de pedido al llegar.') +
			payReminder;

		const html = renderEmail('Tu pedido ya te espera en la tienda.', bodyHtml);
		const text = [
			'Tu pedido está listo para recoger',
			'',
			`${greeting}tu pedido ya te espera en la tienda.`,
			'',
			`Número de pedido: ${order.number}`,
			orderLinesText(order),
			'',
			'Menciona tu número de pedido al llegar.',
			order.status === 'pending' ? `Pagas al recoger — ${total}.` : ''
		]
			.filter(Boolean)
			.join('\n');

		return { subject: `Listo para recoger: ${order.number}`, html, text };
	}

	// Delivery — "en camino".
	const bodyHtml =
		h1('Tu pedido está en camino') +
		p(`${greeting}tu pedido ${esc(order.number)} salió de la vinícola.`) +
		panel(
			fulfillmentBlock(order) +
				`<div style="height:12px;line-height:12px;">&nbsp;</div>` +
				orderLinesRows(order)
		) +
		p(
			`Si algo se ofrece, escríbenos por <a href="${COMPANY_DATA.WHATSAPP_CONTACT_URL}" style="color:#510128;">WhatsApp</a>.`
		);

	const html = renderEmail(`Tu pedido ${order.number} salió de la vinícola.`, bodyHtml);
	const text = [
		'Tu pedido está en camino',
		'',
		`${greeting}tu pedido ${order.number} salió de la vinícola.`,
		'',
		fulfillmentText(order),
		orderLinesText(order),
		'',
		`Si algo se ofrece, escríbenos por WhatsApp: ${COMPANY_DATA.WHATSAPP_CONTACT_URL}`
	].join('\n');

	return { subject: `Tu pedido ${order.number} está en camino`, html, text };
}
