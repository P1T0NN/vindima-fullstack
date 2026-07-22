// CONFIG
import { REWARDS_CONFIG } from '@/shared/config.js';

// UTILS
import { formatDateLong } from '@/utils/formatters';

// LAYOUT
import { renderEmail, h1, p, panel, button, siteUrl, firstName, esc } from './emailLayout';

// TYPES
import type { EmailContent } from '@/shared/features/emails/types/emailsTypes';

/**
 * R2 — rewards about to expire (`EmailSystemDesign.md` §5 R2). The most marketing-adjacent
 * email; stays transactional by being specific — exact counts, exact date. The escape hatch
 * (one purchase resets everything) is stated plainly. Sent once per expiry window (`warnedAt` guard).
 */
export function rewardExpiryWarningEmail(
	name: string,
	stamps: number,
	availableRewards: number,
	expiresAtMs: number
): EmailContent {
	const hi = firstName(name);
	const date = formatDateLong(expiresAtMs);
	const days = REWARDS_CONFIG.EXPIRY.WARN_DAYS_BEFORE;

	// What exactly they'd lose — numbers, not vague urgency.
	const lossParts: string[] = [];
	if (stamps > 0) lossParts.push(`${stamps} ${stamps === 1 ? 'sello' : 'sellos'}`);
	if (availableRewards > 0)
		lossParts.push(
			`${availableRewards} ${availableRewards === 1 ? 'artículo gratis' : 'artículos gratis'}`
		);
	const loss = lossParts.join(' y ');

	const bodyHtml =
		h1('No pierdas tus recompensas') +
		p(
			`${hi ? `Hola ${esc(hi)}, ` : 'Hola, '}tienes ${loss} que expirarán el <strong>${date}</strong> por inactividad.`
		) +
		panel(
			`<p style="margin:0;text-align:center;font-family:Arial,Helvetica,sans-serif;font-size:15px;color:#1c1418;">${loss}<br /><span style="color:rgba(28,20,24,0.6);font-size:13px;">Expiran el ${date}</span></p>`
		) +
		p('Cualquier compra reinicia el contador y conserva todo tu progreso.') +
		button('Ir a la tienda', siteUrl('/shop'));

	const html = renderEmail(`Tus recompensas expiran el ${date}.`, bodyHtml);

	const text = [
		'No pierdas tus recompensas',
		'',
		`${hi ? `Hola ${hi}, ` : 'Hola, '}tienes ${loss} que expirarán el ${date} por inactividad.`,
		'',
		'Cualquier compra reinicia el contador y conserva todo tu progreso.',
		`Ir a la tienda: ${siteUrl('/shop')}`
	].join('\n');

	return { subject: `Tus sellos expiran en ${days} días`, html, text };
}
