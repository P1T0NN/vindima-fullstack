<script lang="ts">
	import { Avatar as AvatarPrimitive } from 'bits-ui';
	import { cn } from '@/utils/utils.js';
	import type { HTMLImgAttributes } from 'svelte/elements';

	type AvatarImageElementProps = HTMLImgAttributes & {
		'data-slot'?: string;
		'data-status'?: string;
	};

	let {
		ref = $bindable(null),
		class: className,
		...restProps
	}: AvatarPrimitive.ImageProps = $props();
</script>

<AvatarPrimitive.Image
	bind:ref
	data-slot="avatar-image"
	class={cn('aspect-square size-full rounded-full object-cover', className)}
	{...restProps}
>
	{#snippet child({ props })}
		{@const imageProps = props as AvatarImageElementProps}
		<img
			alt={imageProps.alt}
			aria-hidden={imageProps['aria-hidden']}
			class={cn(
				'aspect-square size-full rounded-full object-cover',
				className,
				imageProps['data-status'] === 'loaded' ? 'block' : 'hidden'
			)}
			crossorigin={imageProps.crossorigin}
			data-slot={imageProps['data-slot']}
			data-status={imageProps['data-status']}
			id={imageProps.id}
			referrerpolicy={imageProps.referrerpolicy}
			src={imageProps.src}
		/>
	{/snippet}
</AvatarPrimitive.Image>
