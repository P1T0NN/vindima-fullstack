// UTILS
import { formatMoneyMinor } from '@/utils/formatters';

// LAYOUT
import { renderEmail, h1, p, panel, button, siteUrl, firstName, esc } from './emailLayout';
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
 * O2 — payment confirmed / receipt (`EmailSystemDesign.md` §5 O2). The customer's proof of
 * purchase: it must be complete on its own. `reward` (optional) adds the quiet stamp line
 * when the order earned one. CTA only for authenticated customers (guests have no order page).
 */
export function orderPaidEmail(
	order: Doc<'orders'>,
	reward?: { stamps: number; perReward: number; completedCard: boolean }
): EmailContent {
	const hi = firstName(order.name);
	const total = formatMoneyMinor(order.amounts.totalMinor, order.currency);
	const context = `${hi ? `Hola ${esc(hi)}, ` : 'Hola, '}recibimos tu pago de <strong>${total}</strong>.`;

	let rewardLine = '';
	if (reward) {
		rewardLine = reward.completedCard
			? p(`Este pedido completó tu tarjeta — tienes un artículo gratis esperándote.`, true)
			: p(`Este pedido suma 1 sello a tu tarjeta (${reward.stamps} de ${reward.perReward}).`, true);
	}

	const nextLine =
		order.delivery.kind === 'pickup'
			? 'Te avisaremos cuando esté listo para recoger.'
			: 'Te escribiremos cuando salga de la vinícola.';

	const cta = order.userId ? button('Ver mi pedido', siteUrl('/my-orders')) : '';

	const bodyHtml =
		h1('Tu pedido está confirmado') +
		p(context) +
		panel(
			`<p style="margin:0 0 12px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#1c1418;"><strong>Pedido ${esc(order.number)}</strong></p>` +
				orderSummaryRows(order)
		) +
		rewardLine +
		panel(fulfillmentBlock(order)) +
		p(nextLine) +
		cta;

	const html = renderEmail(`Recibimos tu pago de ${total}.`, bodyHtml);

	const text = [
		'Tu pedido está confirmado',
		'',
		`${hi ? `Hola ${hi}, ` : 'Hola, '}recibimos tu pago de ${total}.`,
		'',
		`Pedido ${order.number}`,
		orderSummaryText(order),
		'',
		fulfillmentText(order),
		'',
		reward
			? reward.completedCard
				? 'Este pedido completó tu tarjeta — tienes un artículo gratis esperándote.'
				: `Este pedido suma 1 sello a tu tarjeta (${reward.stamps} de ${reward.perReward}).`
			: '',
		nextLine,
		order.userId ? `Ver mi pedido: ${siteUrl('/my-orders')}` : ''
	]
		.filter(Boolean)
		.join('\n');

	return { subject: `Pedido confirmado ${order.number}`, html, text };
}
