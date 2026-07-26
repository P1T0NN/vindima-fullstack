// CONFIG
import { CHECKOUT_CONFIG } from '@/shared/config.js';

// LAYOUT
import { renderEmail, h1, p, panel, button, firstName, esc } from './emailLayout';
import {
	orderSummaryRows,
	orderSummaryText,
	fulfillmentBlock,
	fulfillmentText
} from './orderSummaryTable';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

/**
 * O1 — order received, PENDING orders only (`EmailSystemDesign.md` §5 O1). Its whole reason
 * to exist is the "what happens next" line: manual = pay on pickup/delivery; redirect = finish
 * payment (with a CTA to `paymentUrl`). With `SETTLE_ON_PLACE` on, this rarely fires — the
 * receipt (O2) collapses it.
 *
 * **`paymentUrl` is currently unreachable in this app, on purpose.** Online orders are placed as
 * `draft` (`ordersSchema.ts`) and get no O1 at all: emailing someone that we received an order
 * they never paid for is exactly what that rule exists to stop. Their first email is the O2
 * receipt, sent by the webhook. The branch stays because the argument is part of `sendEmail`'s
 * contract and a fork of this template may want a "finish your payment" nudge.
 */
export function orderReceivedEmail(order: Doc<'orders'>, paymentUrl?: string): EmailContent {
	const hi = firstName(order.name);
	const context = `${hi ? `Hola ${esc(hi)}, ` : 'Hola, '}tu pedido <strong>${esc(order.number)}</strong> está reservado.`;

	const receiveVerb = order.delivery.kind === 'pickup' ? 'recoger' : 'recibir';
	// `paymentUrl` only exists for online orders, so the reservation window is the online one.
	const nextLine = paymentUrl
		? `Completa tu pago para confirmarlo — tu pedido se reserva por ${CHECKOUT_CONFIG.PENDING_EXPIRY_HOURS_ONLINE} horas.`
		: `Pagas al ${receiveVerb} tu pedido. Te avisaremos cuando esté ${order.delivery.kind === 'pickup' ? 'listo' : 'en camino'}.`;

	const cta = paymentUrl ? button('Completar pago', paymentUrl) : '';

	const bodyHtml =
		h1('Recibimos tu pedido') +
		p(context) +
		panel(
			`<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1c1418;"><strong>Pedido ${esc(order.number)}</strong></p>` +
				orderSummaryRows(order)
		) +
		panel(fulfillmentBlock(order)) +
		p(nextLine) +
		cta;

	const html = renderEmail(`Tu pedido ${order.number} está reservado.`, bodyHtml);

	const text = [
		'Recibimos tu pedido',
		'',
		`${hi ? `Hola ${hi}, ` : 'Hola, '}tu pedido ${order.number} está reservado.`,
		'',
		`Pedido ${order.number}`,
		orderSummaryText(order),
		'',
		fulfillmentText(order),
		'',
		nextLine,
		paymentUrl ? `Completar pago: ${paymentUrl}` : ''
	]
		.filter(Boolean)
		.join('\n');

	return { subject: `Recibimos tu pedido ${order.number}`, html, text };
}
