<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';

	type Props = Pick<
		HTMLImgAttributes,
		| 'alt'
		| 'aria-hidden'
		| 'class'
		| 'crossorigin'
		| 'decoding'
		| 'draggable'
		| 'fetchpriority'
		| 'height'
		| 'ismap'
		| 'loading'
		| 'referrerpolicy'
		| 'sizes'
		| 'srcset'
		| 'usemap'
		| 'width'
	> & { src: string };

	let {
		src,
		alt,
		'aria-hidden': ariaHidden,
		class: className,
		crossorigin,
		decoding,
		draggable,
		fetchpriority,
		height,
		ismap,
		loading,
		referrerpolicy,
		sizes,
		srcset,
		usemap,
		width
	}: Props = $props();
</script>

<img
	{src}
	{alt}
	aria-hidden={ariaHidden}
	class={className}
	{crossorigin}
	{decoding}
	{draggable}
	{fetchpriority}
	{height}
	{ismap}
	{loading}
	{referrerpolicy}
	{sizes}
	{srcset}
	{usemap}
	{width}
/>
