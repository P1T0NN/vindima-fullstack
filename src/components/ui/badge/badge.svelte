<script lang="ts" module>
	import { type VariantProps, tv } from 'tailwind-variants';

	export const badgeVariants = tv({
		base: 'inline-flex w-fit shrink-0 items-center justify-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium tracking-wide whitespace-nowrap transition-colors [&>svg]:pointer-events-none [&>svg]:size-3.5 [&>svg]:shrink-0',
		variants: {
			variant: {
				default: 'border-transparent bg-primary text-primary-foreground',
				secondary: 'border-transparent bg-secondary text-secondary-foreground',
				destructive: 'border-transparent bg-destructive/10 text-destructive',
				outline: 'border-border bg-transparent text-foreground'
			}
		},
		defaultVariants: {
			variant: 'default'
		}
	});

	export type BadgeVariant = VariantProps<typeof badgeVariants>['variant'];
</script>

<script lang="ts">
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import type { HTMLAttributes } from 'svelte/elements';

	let {
		ref = $bindable(null),
		class: className,
		variant = 'default',
		children,
		...restProps
	}: WithElementRef<HTMLAttributes<HTMLSpanElement>> & { variant?: BadgeVariant } = $props();
</script>

<span
	bind:this={ref}
	data-slot="badge"
	class={cn(badgeVariants({ variant }), className)}
	{...restProps}
>
	{@render children?.()}
</span>
