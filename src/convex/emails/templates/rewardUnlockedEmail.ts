// LAYOUT
import { renderEmail, h1, p, panel, button, siteUrl, firstName, esc } from './emailLayout';

// CONFIG
import { EMAIL_CONFIG } from '@/shared/config.js';

// TYPES
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

/**
 * R1 — free item unlocked (`EmailSystemDesign.md` §5 R1). The one email in the system with a
 * celebratory emoji + exclamation mark. Sets expectations ("applies itself in the cart") to
 * prevent support tickets. `inactivityMonths` (null = never expires) adds the honest keep-alive line.
 */
export function rewardUnlockedEmail(
	name: string,
	perReward: number,
	inactivityMonths: number | null
): EmailContent {
	const hi = firstName(name);

	const stampsBadge = `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 4px;">
  <tr><td align="center" style="padding:8px 0;">
    <span style="font-family:'Courier New',Courier,monospace;font-size:26px;font-weight:bold;color:${EMAIL_CONFIG.ACCENT};">${perReward} de ${perReward} sellos &#10003;</span>
  </td></tr>
</table>`;

	const keepLine =
		inactivityMonths !== null
			? p(
					`Se conserva mientras tu cuenta tenga actividad en los últimos ${inactivityMonths} meses.`,
					true
				)
			: '';

	const bodyHtml =
		h1('¡Ganaste un artículo gratis!') +
		p(
			`${hi ? `Hola ${esc(hi)}, ` : 'Hola, '}tu compra número ${perReward} completó tu tarjeta de sellos.`
		) +
		panel(
			stampsBadge +
				`<p style="margin:8px 0 0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:#1c1418;">Elige cualquier artículo elegible, gratis, en tu próximo pedido.</p>`
		) +
		p(
			'Tu recompensa te espera en tu cuenta — se aplica sola al elegir tu artículo en el carrito.'
		) +
		keepLine +
		button('Elegir mi regalo', siteUrl('/shop'));

	const html = renderEmail('Completaste tu tarjeta de sellos.', bodyHtml);

	const text = [
		'¡Ganaste un artículo gratis!',
		'',
		`${hi ? `Hola ${hi}, ` : 'Hola, '}tu compra número ${perReward} completó tu tarjeta de sellos.`,
		'',
		`${perReward} de ${perReward} sellos ✓`,
		'Elige cualquier artículo elegible, gratis, en tu próximo pedido.',
		'',
		'Tu recompensa te espera en tu cuenta — se aplica sola al elegir tu artículo en el carrito.',
		inactivityMonths !== null
			? `Se conserva mientras tu cuenta tenga actividad en los últimos ${inactivityMonths} meses.`
			: '',
		`Elegir mi regalo: ${siteUrl('/shop')}`
	]
		.filter(Boolean)
		.join('\n');

	return { subject: '🎉 Completaste tu tarjeta — tienes un regalo', html, text };
}
