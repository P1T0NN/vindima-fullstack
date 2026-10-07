<script lang="ts">
	// SVELTEKIT IMPORTS
	import { afterNavigate } from '$app/navigation';

	// HELPERS
	import { initFacebookPixel, trackFacebookPixelEvent } from './facebookPixel';

	interface Props {
		/** Meta (Facebook) Pixel ID. An empty string disables tracking. */
		pixelId: string;
		/** Turns tracking on/off without unmounting (e.g. `false` in dev or on admin routes). */
		enabled?: boolean;
	}

	let { pixelId, enabled = true }: Props = $props();

	const active = $derived(enabled && pixelId !== '');

	// Runs on mount (the `enter` navigation) and on every client-side navigation,
	// so each page view is reported exactly once — initial load, SPA route
	// changes, and back/forward alike.
	afterNavigate(() => {
		if (!active) return;
		initFacebookPixel(pixelId);
		trackFacebookPixelEvent('PageView');
	});
</script>

{#if active}
	<!-- Fallback for visitors without JavaScript, mirroring the official snippet. -->
	<noscript>
		<img
			height="1"
			width="1"
			class="hidden"
			alt=""
			src="https://www.facebook.com/tr?id={pixelId}&ev=PageView&noscript=1"
		/>
	</noscript>
{/if}
