<script lang="ts">
	import type { EnhancedImgAttributes } from '@sveltejs/enhanced-img';

	type Props = EnhancedImgAttributes;

	let { src, ...restProps }: Props = $props();
</script>

<enhanced:img {src} {...restProps} />
