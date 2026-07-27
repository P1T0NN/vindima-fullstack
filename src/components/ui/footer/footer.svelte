<script lang="ts">
	// LIBRARIES

	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import Link from '@/components/ui/link/link.svelte';
	import Logo from '@/components/ui/logo/logo.svelte';
	import Instagram from '@/svgs/instagram.svelte';

	// UTILS
	import { cn } from '@/utils/utils.js';
	import { PAGE_CONTAINER } from '@/shared/ui/pageContainer.js';

	// DATA
	import { footerNavLinks } from './footerData.js';

	// TAILWIND
	import {
		footerBodyTextClass,
		footerHeadingClass,
		footerLinkClass,
		footerMetaLineClass
	} from './footerTailwindClasses.js';

	type Props = {
		class?: string;
	};

	let { class: className }: Props = $props();

	const year = new Date().getFullYear();
</script>

<footer
	class={cn(
		'w-full max-w-full overflow-x-clip bg-chart-5 pt-[54px] pb-[38px] text-accent-surface-muted',
		className
	)}
>
	<div
		class={cn(
			PAGE_CONTAINER,
			'grid grid-cols-1 items-start gap-8 sm:grid-cols-2 sm:gap-[30px] md:grid-cols-3 lg:grid-cols-[1.4fr_1fr_1fr]'
		)}
	>
		<div class="min-w-0 sm:col-span-2 md:col-span-1">
			<Logo class="mb-3.5 transition-opacity hover:opacity-90" />
			<p class={footerBodyTextClass}>{COMPANY_DATA.DESCRIPTION}</p>
			<a
				href={COMPANY_DATA.INSTAGRAM_URL}
				target="_blank"
				rel="noopener noreferrer"
				aria-label="Instagram"
				class="mt-1.5 -ml-2.5 inline-flex p-2.5 text-accent-surface-muted transition-opacity hover:opacity-100 opacity-70"
			>
				<Instagram class="size-5" />
			</a>
		</div>

		<nav aria-label="Explorar" class="flex min-w-0 flex-col gap-2.5">
			<div class={cn(footerHeadingClass, 'mb-1')}>Explorar</div>
			{#each footerNavLinks as item (item.href)}
				<Link href={item.href} class={footerLinkClass}>
					{item.label}
				</Link>
			{/each}
		</nav>

		<div class="flex min-w-0 flex-col gap-2.5">
			<div class={cn(footerHeadingClass, 'mb-1')}>Visítanos</div>
			<span class={footerMetaLineClass}>{COMPANY_DATA.ADDRESS.LINE_1}</span>
			<span class={footerMetaLineClass}>{COMPANY_DATA.ADDRESS.LINE_2}</span>
			{#each COMPANY_DATA.HOURS as h (h.DAYS)}
				<span class={footerMetaLineClass}>{h.DAYS}: {h.TIME}</span>
			{/each}
			<a
				href="mailto:{COMPANY_DATA.EMAIL}"
				class={cn(footerMetaLineClass, 'transition-opacity hover:opacity-100')}
			>
				{COMPANY_DATA.EMAIL}
			</a>
		</div>
	</div>

	<div
		class={cn(
			PAGE_CONTAINER,
			'mt-[34px] border-t border-primary/20 pt-[18px] text-xs leading-normal text-accent-surface-muted/80'
		)}
	>
		{`© ${year} ${COMPANY_DATA.NAME} · Hecho en Aguascalientes`}
	</div>
</footer>
