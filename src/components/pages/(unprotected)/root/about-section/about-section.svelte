<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import Section from '@/components/ui/section/section.svelte';
</script>

<Section id="about" contain={false} yPadding="none" surface="background">
	<div class="grid min-h-section-tall grid-cols-1 items-stretch lg:grid-cols-2">
		<div
			class="flex min-h-hero-lg items-center justify-center bg-muted lg:min-h-section-tall"
			aria-hidden="true"
		>
			<span class="text-center text-sm tracking-widest text-muted-foreground/70 uppercase">
				Winery photo
			</span>
		</div>

		<div class="flex flex-col justify-center px-6 py-16 sm:px-12 lg:px-16 lg:py-20">
			<p class="mb-4 text-xs font-medium tracking-widest text-chart-2 uppercase">About us</p>
			<h2
				class="font-display text-4xl leading-none font-semibold tracking-wide text-accent uppercase sm:text-5xl"
			>
				An organic<br />
				winery
			</h2>
			<p class="mt-7 max-w-lg text-base leading-loose text-foreground/75">
				Vindima was born in 2023 in the heart of Aguascalientes with a simple idea: bring people
				together around good wine and food made by hand. We work with local producers, ferment our
				own bread and cure seasonal charcuterie.
			</p>
			<p class="mt-4 max-w-lg text-base leading-loose text-foreground/75">
				Every board, every glass and every tapa is designed for great hosts — for those moments when
				the table becomes the best place in the home.
			</p>
		</div>
	</div>
</Section>
