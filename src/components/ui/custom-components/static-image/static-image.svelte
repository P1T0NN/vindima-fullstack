<script lang="ts">
	import type { HTMLImgAttributes } from 'svelte/elements';

	type Props = Omit<HTMLImgAttributes, 'src'> & { src: string };

	let { src, ...restProps }: Props = $props();
</script>

<img {src} {...restProps} />
