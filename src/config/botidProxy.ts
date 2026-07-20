/**
 * BotID proxy paths — must stay aligned with `botid` package internals and
 * {@link https://vercel.com/docs/botid/get-started Vercel BotID docs}.
 *
 * SvelteKit has no `withBotId()` helper; use these in `vercel.json` and
 * `vite.config.ts` so challenge scripts proxy instead of 404ing as HTML.
 */
export const BOTID_PROXY_PREFIX =
	'/149e9513-01fa-4fb0-aad4-566afd725d1b/2d206a39-8ed7-437e-a3be-862e0f06eea3' as const;

export const BOTID_CHALLENGE_PATH = `${BOTID_PROXY_PREFIX}/a-4-a/c.js` as const;

export const BOTID_API_ORIGIN =
	(process.env.OVERRIDE_BOTID_SERVER_URL as string | undefined) ??
	'https://api.vercel.com/bot-protection';
