import adapter from '@sveltejs/adapter-auto';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-auto only supports some environments, see https://svelte.dev/docs/kit/adapter-auto for a list.
		// If your environment is not supported, or you settled on a specific environment, switch out the adapter.
		// See https://svelte.dev/docs/kit/adapters for more information about adapters.
		adapter: adapter(),
		alias: {
			'@/*': './src/*'
		},
		// SvelteKit's CSRF origin check is on by default. Add extra allowed
		// origins here only if needed (e.g. multi-domain setups). An empty list
		// (or omitting `csrf` entirely) keeps the default same-origin policy.
		csrf: {
			trustedOrigins: []
		},
		experimental: {
			remoteFunctions: true
		},
		// CSP: SvelteKit emits hashes for its own inline scripts/styles in 'auto'
		// mode, so we don't need 'unsafe-inline' / 'unsafe-eval' for script-src.
		// 'unsafe-inline' stays on style-src for Tailwind/inline styles.
		csp: {
			mode: 'auto',
			directives: {
				'default-src': ['self'],
				'script-src': [
					'self',
					'blob:',
					// Google Maps JavaScript API
					'https://*.googleapis.com',
					'https://*.gstatic.com',
					'https://*.google.com',
					'https://*.ggpht.com',
					'https://*.googleusercontent.com',
					'https://va.vercel-scripts.com',
					'https://umami-sable-iota.vercel.app'
				],
				'worker-src': ['self', 'blob:'],
				'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
				'img-src': ['self', 'data:', 'https:', 'blob:'],
				'font-src': ['self', 'data:', 'https://fonts.gstatic.com'],
				'connect-src': [
					'self',
					'data:',
					'blob:',
					'https://accounts.google.com',
					'https://oauth2.googleapis.com',
					'https://www.googleapis.com',
					// Google Maps JavaScript API
					'https://*.googleapis.com',
					'https://*.google.com',
					'https://*.gstatic.com',
					'https://*.convex.cloud',
					'wss://*.convex.cloud',
					// Vercel Analytics + Speed Insights telemetry endpoint
					'https://va.vercel-scripts.com',
					// Cloudflare R2 — direct browser PUT to signed upload URLs and GET on public objects
					'https://*.r2.cloudflarestorage.com',
					'https://*.r2.dev',
					// Umami analytics
					'https://umami-sable-iota.vercel.app'
				],
				'frame-src': ['self', 'https://accounts.google.com', 'https://*.google.com'],
				'object-src': ['none'],
				'base-uri': ['self'],
				'form-action': ['self'],
				'frame-ancestors': ['none'],
				'upgrade-insecure-requests': true
			}
		}
	},
	compilerOptions: {
		experimental: {
			async: true
		}
	}
};

export default config;
