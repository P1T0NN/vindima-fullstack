<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';
	import { formatNameInitials } from '@/utils/formatNameInitials.js';

	// Avatar circle: image when available, initials otherwise. Reusable wherever
	// a user's face is shown — header trigger, dropdown menu, comments, etc.
	let {
		name,
		image,
		class: className,
		size = 'md'
	}: {
		name: string;
		image?: string | null;
		class?: string;
		size?: 'sm' | 'md' | 'lg';
	} = $props();

	const sizeClasses = {
		sm: 'size-6 text-xs',
		md: 'size-9 text-sm',
		lg: 'size-12 text-base'
	};
</script>

{#if image}
	<img
		src={image}
		alt={name}
		class={cn('rounded-full object-cover ring-1 ring-border', sizeClasses[size], className)}
	/>
{:else}
	<span
		class={cn(
			'flex items-center justify-center rounded-full bg-primary font-medium text-primary-foreground',
			sizeClasses[size],
			className
		)}
	>
		{formatNameInitials(name)}
	</span>
{/if}
