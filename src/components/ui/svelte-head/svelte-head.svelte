<script lang="ts">
	// SVELTEKIT
	import { page } from '$app/state';
	import { PUBLIC_SITE_URL } from '$env/static/public';

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config';

	// CLASSES
	import { breadcrumbLabel } from '@/components/ui/breadcrumb/breadcrumbClass.svelte.js';

	let {
		title,
		description,
		image,
		ogType = 'website',
		noindex = false,
		suffixSiteName = true
	}: {
		title?: string;
		description?: string;
		/** Site-relative or absolute social-share image. Defaults to {@link COMPANY_DATA.OG_IMAGE}. */
		image?: string;
		ogType?: 'website' | 'article';
		/** When true, private/account/checkout routes should not be indexed. */
		noindex?: boolean;
		/** Append ` | {site name}` to the document title. Disable for the home page. */
		suffixSiteName?: boolean;
	} = $props();

	// Stable configured origin for canonical/OG URLs; falls back to the request origin
	// when `PUBLIC_SITE_URL` is unset (e.g. preview deploys without env configured).
	const origin = $derived((PUBLIC_SITE_URL || page.url.origin).replace(/\/+$/, ''));

	const pathname = $derived(page.url.pathname);
	const canonical = $derived(`${origin}${pathname}`);

	const titleFromPath = $derived.by(() => {
		const segments = pathname.split('/').filter(Boolean);
		if (segments.length === 0) return 'Inicio';
		return segments[segments.length - 1]
			.replace(/[-_]+/g, ' ')
			.replace(/\b\w/g, (c) => c.toUpperCase());
	});

	const resolvedTitle = $derived(title ?? breadcrumbLabel.current ?? titleFromPath);
	const fullTitle = $derived(
		suffixSiteName ? `${resolvedTitle} | ${COMPANY_DATA.NAME}` : resolvedTitle
	);
	const resolvedDescription = $derived(
		description ??
			(resolvedTitle === 'Inicio'
				? COMPANY_DATA.DESCRIPTION
				: `${resolvedTitle} — ${COMPANY_DATA.DESCRIPTION}`)
	);

	const isCustomImage = $derived(image !== undefined && image !== COMPANY_DATA.OG_IMAGE);
	const imagePath = $derived(image ?? COMPANY_DATA.OG_IMAGE);
	const imageUrl = $derived(/^https?:\/\//.test(imagePath) ? imagePath : `${origin}${imagePath}`);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={resolvedDescription} />
	<link rel="canonical" href={canonical} />

	<!-- Open Graph -->
	<meta property="og:type" content={ogType} />
	<meta property="og:site_name" content={COMPANY_DATA.NAME} />
	<meta property="og:title" content={fullTitle} />
	<meta property="og:description" content={resolvedDescription} />
	<meta property="og:url" content={canonical} />
	<meta property="og:image" content={imageUrl} />
	<meta property="og:image:alt" content="{resolvedTitle} — {COMPANY_DATA.NAME}" />
	{#if !isCustomImage}
		<meta property="og:image:width" content={String(COMPANY_DATA.OG_IMAGE_WIDTH)} />
		<meta property="og:image:height" content={String(COMPANY_DATA.OG_IMAGE_HEIGHT)} />
	{/if}
	<meta property="og:locale" content="es_MX" />

	<!-- Twitter -->
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content={fullTitle} />
	<meta name="twitter:description" content={resolvedDescription} />
	<meta name="twitter:image" content={imageUrl} />

	{#if noindex}
		<meta name="robots" content="noindex, nofollow" />
	{/if}
</svelte:head>
