// LIBRARIES
import { v } from 'convex/values';
import { internalAction } from '@/convex/_generated/server';

// CONFIG
import { COMPANY_DATA } from '@/shared/config.js';

/** Personal WhatsApp alert, scheduled only when an order first becomes paid. */
export const notifyPaidOrder = internalAction({
	args: { number: v.string() },
	returns: v.null(),
	handler: async (_ctx, { number }): Promise<null> => {
		const phone = process.env.CALLMEBOT_PHONE;
		const apikey = process.env.CALLMEBOT_APIKEY;
		if (!phone || !apikey) throw new Error('CALLMEBOT_PHONE and CALLMEBOT_APIKEY must be set');

		const url = new URL('https://api.callmebot.com/whatsapp.php');
		url.search = new URLSearchParams({
			phone,
			text: `Nuevo pedido pagado ${number}. Visita https://${COMPANY_DATA.DOMAIN}/admin/orders e inicia sesión con tu cuenta de administrador para verlo.`,
			apikey
		}).toString();
		const response = await fetch(url);
		if (!response.ok) throw new Error(`CallMeBot returned HTTP ${response.status}`);
		return null;
	}
});
