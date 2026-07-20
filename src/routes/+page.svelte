<script lang="ts">
	// CONFIG
	import { COMPANY_DATA } from '@/shared/config.js';

	// COMPONENTS
	import SvelteHead from '@/components/ui/svelte-head/svelte-head.svelte';
	import HeroSection from '@/components/pages/(unprotected)/root/hero-section.svelte';
	import ShopSection from '@/components/pages/(unprotected)/root/shop-section/shop-section.svelte';
	import AboutSection from '@/components/pages/(unprotected)/root/about-section/about-section.svelte';
	import RecommendationsSection from '@/components/pages/(unprotected)/root/recommendations-section/recommendations-section.svelte';
	import EventsSection from '@/components/pages/(unprotected)/root/events-section/events-section.svelte';
	import ContactSection from '@/components/pages/(unprotected)/root/contact-section/contact-section.svelte';
</script>

<SvelteHead title={COMPANY_DATA.NAME} suffixSiteName={false} description={COMPANY_DATA.DESCRIPTION} />

<HeroSection />

<ShopSection />

<RecommendationsSection />

<AboutSection />

<EventsSection />

<ContactSection />
