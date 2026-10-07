/**
 * Dependency-free Meta (Facebook) Pixel loader.
 *
 * A faithful port of the official base snippet, shipped from the app bundle
 * instead of an inline `<script>` — inline scripts rendered by components are
 * not nonced by SvelteKit under its CSP, whereas the dynamically inserted
 * `fbevents.js` only needs `https://connect.facebook.net` in `script-src`.
 */

type Fbq = {
	(...args: unknown[]): void;
	callMethod?: (...args: unknown[]) => void;
	queue: unknown[][];
	loaded: boolean;
	version: string;
	push: Fbq;
};

declare global {
	interface Window {
		fbq?: Fbq;
		_fbq?: Fbq;
	}
}

const FBEVENTS_SRC = 'https://connect.facebook.net/en_US/fbevents.js';

/**
 * Loads `fbevents.js` and initializes the Pixel. Calls made before the script
 * arrives are queued, preserving order. Safe to call repeatedly — only the
 * first call has an effect.
 */
export function initFacebookPixel(pixelId: string): void {
	if (typeof window === 'undefined' || window.fbq) return;

	const fbq = ((...args: unknown[]) => {
		if (fbq.callMethod) {
			fbq.callMethod(...args);
		} else {
			fbq.queue.push(args);
		}
	}) as Fbq;

	fbq.push = fbq;
	fbq.queue = [];
	fbq.loaded = true;
	fbq.version = '2.0';

	window.fbq = fbq;
	window._fbq = fbq;

	const script = document.createElement('script');
	script.async = true;
	script.src = FBEVENTS_SRC;

	const first = document.getElementsByTagName('script')[0];
	first.parentNode?.insertBefore(script, first);

	fbq('init', pixelId);
}

/** Tracks a standard or custom Pixel event. No-ops when the Pixel is not initialized. */
export function trackFacebookPixelEvent(event: string, params?: Record<string, unknown>): void {
	if (typeof window === 'undefined' || !window.fbq) return;

	if (params) {
		window.fbq('track', event, params);
	} else {
		window.fbq('track', event);
	}
}
