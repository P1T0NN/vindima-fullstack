// LIBRARIES
import { initBotId } from 'botid/client/core';

// CONFIG
import { BOTID_PROTECTED_ROUTES } from '@/shared/config.js';

// TYPES
import type { HandleClientError } from '@sveltejs/kit';

/**
 * Vercel BotID — instruments outgoing fetches to listed paths so server-side
 * `checkBotId()` can verify them. See {@link BOTID_PROTECTED_ROUTES}.
 */
export function init() {
	initBotId({
		protect: BOTID_PROTECTED_ROUTES
	});
}

export const handleError: HandleClientError = ({ message }) => {
	return { message };
};
