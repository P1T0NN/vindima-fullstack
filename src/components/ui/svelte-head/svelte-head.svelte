<script lang="ts">
	// SVELTEKIT IMPORTS
	import { page } from '$app/state';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	type Props = {
		title?: string;
		description?: string;
		image?: string;
		type?: 'website' | 'article';
		noIndex?: boolean;
		canonical?: string;
	};

	let { title, description, image, type = 'website', noIndex = false, canonical }: Props = $props();

	const pathname = $derived(page.url.pathname);

	const titleFromPath = $derived.by(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return 'Home';
		return segments[segments.length - 1]
			.replace(/[-_]+/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase());
	});

	const fallbackTitle = $derived(`${titleFromPath} | ${COMPANY_DATA.NAME}`);
	const fullTitle = $derived(title ?? fallbackTitle);
	const metaDescription = $derived(
		description ?? `${titleFromPath} page on ${COMPANY_DATA.NAME}. ${COMPANY_DATA.DESCRIPTION}`
	);
	const canonicalUrl = $derived(canonical ?? `${page.url.origin}${pathname}`);
	const imageUrl = $derived.by(() => {
		if (!image) return undefined;
		if (/^https?:\/\//.test(image)) return image;
		return `${page.url.origin}${image.startsWith('/') ? image : `/${image}`}`;
	});
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={metaDescription} />
	<link rel="canonical" href={canonicalUrl} />

	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={metaDescription} />
	<meta property="og:type" content={type} />
	<meta property="og:url" content={canonicalUrl} />
	<meta property="og:site_name" content={COMPANY_DATA.NAME} />

	<meta name="twitter:card" content={imageUrl ? 'summary_large_image' : 'summary'} />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={metaDescription} />

	{#if imageUrl}
		<meta property="og:image" content={imageUrl} />
		<meta name="twitter:image" content={imageUrl} />
	{/if}

	{#if noIndex}
		<meta name="robots" content="noindex,nofollow" />
	{/if}
</svelte:head>
