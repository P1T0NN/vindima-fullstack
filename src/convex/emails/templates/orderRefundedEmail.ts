// UTILS
import { formatMoneyMinor } from '@/utils/formatters';

// LAYOUT
import { renderEmail, h1, p, panel, firstName, esc } from './emailLayout';

// TYPES
import type { Doc } from '@/convex/_generated/dataModel';
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

/**
 * O7 — refund issued (`EmailSystemDesign.md` §5 O7). Quiet and factual, no CTA. Copy differs
 * by how the order was paid: `cash` money moves offline (staff coordinate); `online` (Stripe)
 * lands back on the payment method in a few business days.
 */
export function orderRefundedEmail(order: Doc<'orders'>): EmailContent {
	const hi = firstName(order.name);
	const amount = formatMoneyMinor(order.amounts.totalMinor, order.currency);

	const nextLine =
		order.paymentMethod === 'online'
			? 'Verás el reembolso en tu método de pago en 5–10 días hábiles.'
			: 'Te contactaremos para coordinar la devolución.';

	const bodyHtml =
		h1('Procesamos tu reembolso') +
		p(
			`${hi ? `Hola ${esc(hi)}, ` : 'Hola, '}reembolsamos tu pedido <strong>${esc(order.number)}</strong>.`
		) +
		panel(
			`<p style="margin:0 0 4px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:rgba(28,20,24,0.6);">Monto reembolsado</p>` +
				`<p style="margin:0;font-family:Arial,Helvetica,sans-serif;font-size:22px;font-weight:bold;color:#1c1418;">${amount}</p>`
		) +
		p(nextLine);

	const html = renderEmail(`Reembolsamos ${amount} de tu pedido ${order.number}.`, bodyHtml);

	const text = [
		'Procesamos tu reembolso',
		'',
		`${hi ? `Hola ${hi}, ` : 'Hola, '}reembolsamos tu pedido ${order.number}.`,
		'',
		`Monto reembolsado: ${amount}`,
		'',
		nextLine
	].join('\n');

	return { subject: `Reembolso de tu pedido ${order.number}`, html, text };
}
