<script lang="ts">
	// LIBRARIES

	// COMPONENTS
	import { Button } from '@/components/ui/button/index.js';
	import { Input } from '@/components/ui/input/index.js';

	// UTILS
	import { cn, type WithElementRef } from '@/utils/utils.js';

	// TYPES
	import type { HTMLInputAttributes } from 'svelte/elements';

	type Props = WithElementRef<Omit<HTMLInputAttributes, 'type' | 'files'>>;

	let {
		ref = $bindable(null),
		value = $bindable(),
		class: className,
		disabled = false,
		...restProps
	}: Props = $props();

	let visible = $state(false);
</script>

<div class="relative w-full">
	<Input
		bind:ref
		bind:value
		type={visible ? 'text' : 'password'}
		class={cn('pe-12', className)}
		{disabled}
		{...restProps}
	/>
	<!-- icon-lg = 44px hit target; pe-12 above keeps typed text clear of it. -->
	<Button
		type="button"
		variant="ghost"
		size="icon-lg"
		class="absolute end-1 top-1/2 z-10 -translate-y-1/2 text-muted-foreground hover:text-foreground"
		onclick={() => (visible = !visible)}
		aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
		aria-pressed={visible}
		{disabled}
	>
		{#if visible}
			<span class="icon-[lucide--eye-off]" ></span>
		{:else}
			<span class="icon-[lucide--eye]" ></span>
		{/if}
	</Button>
</div>
