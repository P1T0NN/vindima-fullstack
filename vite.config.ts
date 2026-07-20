import tailwindcss from '@tailwindcss/vite';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import {
	BOTID_CHALLENGE_PATH,
	BOTID_PROXY_PREFIX
} from './src/config/botidProxy.ts';

export default defineConfig({
	// BotID client loads same-origin challenge/proxy scripts. Vite dev has no
	// vercel.json rewrites, so proxy them to Vercel's bot-protection API.
	server: {
		proxy: {
			[BOTID_CHALLENGE_PATH]: {
				target: 'https://api.vercel.com',
				changeOrigin: true,
				secure: true,
				rewrite: () => '/bot-protection/v1/challenge'
			},
			[BOTID_PROXY_PREFIX]: {
				target: 'https://api.vercel.com',
				changeOrigin: true,
				secure: true,
				rewrite: (path) => `/bot-protection/v1/proxy${path.slice(BOTID_PROXY_PREFIX.length)}`
			}
		}
	},
    plugins: [
        // i18n: intentionally none right now — Paraglide was removed; wuchale's vite plugin
        // slots in here when it gets adopted (it extracts the plain strings from source).
        tailwindcss(),
        sveltekit()
    ]
});
