<script lang="ts">
	// COMPONENTS
	import Section from '@/components/ui/section/section.svelte';
	import ContactLeftContent from './contact-left-content.svelte';
	import ContactRightContent from './contact-right-content.svelte';
</script>

<Section
	id="contact"
	surface="transparent"
	class="bg-primary"
	yPadding="lg"
	ariaLabelledby="contact-heading"
>
	<div class="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:items-start lg:gap-14 xl:gap-16">
		<div class="min-w-0">
			<ContactLeftContent />
		</div>
		<div class="min-w-0">
			<ContactRightContent />
		</div>
	</div>
</Section>
