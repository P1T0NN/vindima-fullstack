// CONFIG
import { CHECKOUT_CONFIG } from '@/shared/config.js';

// UTILS
import { formatMoneyMinor } from '@/utils/formatters';

// LAYOUT
import { renderEmail, h1, p, panel, button, siteUrl, firstName, esc } from './emailLayout';
import { orderLinesRows, orderLinesText } from './orderSummaryTable';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

/**
 * O5 (`reason: 'user'`) + O6 (`reason: 'expired'`) — same skeleton, honest about the cause
 * (`EmailSystemDesign.md` §5 O5/O6). Attributes the cancellation explicitly so it never
 * reads as alarming. Mentions a released reward claim when one rode along.
 */
export function orderCancelledEmail(
	order: Doc<'orders'>,
	reason: 'user' | 'expired'
): EmailContent {
	const hi = firstName(order.name);
	const greeting = hi ? `Hola ${esc(hi)}, ` : 'Hola, ';
	const total = formatMoneyMinor(order.amounts.totalMinor, order.currency);
	const claimLine = order.claimId
		? p('Tu artículo gratis volvió a tu cuenta — úsalo cuando quieras.', true)
		: '';

	const context =
		reason === 'expired'
			? `${greeting}tu pedido <strong>${esc(order.number)}</strong> quedó pendiente de pago por más de ${CHECKOUT_CONFIG.PENDING_EXPIRY_HOURS} horas, así que lo liberamos.`
			: `${greeting}confirmamos que cancelaste el pedido <strong>${esc(order.number)}</strong>.`;

	const nextLine =
		reason === 'expired'
			? 'Tus artículos siguen disponibles si aún los quieres.'
			: 'No se realizó ningún cargo.';

	const bodyHtml =
		h1(reason === 'expired' ? 'Tu pedido expiró' : 'Tu pedido fue cancelado') +
		p(context) +
		panel(
			orderLinesRows(order) +
				`<div style="height:8px;line-height:8px;">&nbsp;</div>` +
				`<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:rgba(28,20,24,0.6);">Total no cobrado: ${total}</p>`
		) +
		claimLine +
		p(nextLine) +
		button('Volver a la tienda', siteUrl('/shop'));

	const preheader =
		reason === 'expired' ? 'Liberamos tu pedido pendiente.' : 'Tu pedido fue cancelado.';
	const html = renderEmail(preheader, bodyHtml);

	const text = [
		reason === 'expired' ? 'Tu pedido expiró' : 'Tu pedido fue cancelado',
		'',
		context.replace(/<\/?strong>/g, ''),
		'',
		orderLinesText(order),
		`Total no cobrado: ${total}`,
		'',
		order.claimId ? 'Tu artículo gratis volvió a tu cuenta — úsalo cuando quieras.' : '',
		nextLine,
		`Volver a la tienda: ${siteUrl('/shop')}`
	]
		.filter(Boolean)
		.join('\n');

	const subject =
		reason === 'expired' ? `Tu pedido ${order.number} expiró` : `Pedido ${order.number} cancelado`;
	return { subject, html, text };
}
