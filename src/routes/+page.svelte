<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import HeroSection from '@/components/pages/(unprotected)/root/hero-section.svelte';
	import ShopSection from '@/components/pages/(unprotected)/root/shop-section/shop-section.svelte';
	import EspacioSection from '@/components/pages/(unprotected)/root/espacio-section/espacio-section.svelte';
	import AboutSection from '@/components/pages/(unprotected)/root/about-section/about-section.svelte';
	import RecommendationsSection from '@/components/pages/(unprotected)/root/recommendations-section/recommendations-section.svelte';
	import ContactSection from '@/components/ui/sections/contact-section/contact-section.svelte';
</script>

<SvelteHead
	title={COMPANY_DATA.NAME}
	suffixSiteName={false}
	description={COMPANY_DATA.DESCRIPTION}
/>

<HeroSection />

<ShopSection />

<EspacioSection />

<RecommendationsSection />

<AboutSection />

<ContactSection />
