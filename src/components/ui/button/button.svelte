<script lang="ts" module>
	import { cn, type WithElementRef } from '@/utils/utils.js';
	import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements';
	import { type VariantProps, tv } from 'tailwind-variants';

	export const buttonVariants = tv({
		base: "focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive dark:aria-invalid:border-destructive/50 rounded-[2px] border border-transparent bg-clip-padding text-xs font-semibold leading-none tracking-[0.13em] uppercase focus-visible:ring-3 active:not-aria-[haspopup]:translate-y-px aria-invalid:ring-3 [&_svg:not([class*='size-'])]:size-4 group/button inline-flex shrink-0 items-center justify-center whitespace-nowrap transition-all outline-none select-none disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
		variants: {
			variant: {
				default:
					'border-primary bg-primary text-primary-foreground hover:border-[#e7c069] hover:bg-[#e7c069] [a]:hover:border-[#e7c069] [a]:hover:bg-[#e7c069]',
				outline:
					'border-accent/40 bg-transparent text-accent hover:border-accent hover:bg-accent/5 aria-expanded:border-accent aria-expanded:bg-accent/5',
				secondary:
					'border-secondary bg-secondary text-secondary-foreground hover:bg-secondary/80 aria-expanded:bg-secondary aria-expanded:text-secondary-foreground',
				ghost:
					'hover:bg-muted hover:text-foreground dark:hover:bg-muted/50 aria-expanded:bg-muted aria-expanded:text-foreground',
				destructive:
					'bg-destructive/10 hover:bg-destructive/20 focus-visible:ring-destructive/20 dark:focus-visible:ring-destructive/40 dark:bg-destructive/20 text-destructive focus-visible:border-destructive/40 dark:hover:bg-destructive/30',
				whatsapp:
					'border-whatsapp bg-whatsapp text-whatsapp-foreground hover:bg-whatsapp/90 focus-visible:ring-whatsapp/30 focus-visible:border-whatsapp/40 [a]:hover:bg-whatsapp/90',
				link: 'border-transparent font-medium tracking-normal text-primary normal-case underline-offset-4 hover:underline'
			},
			size: {
				default:
					'h-auto gap-2 px-5 py-3 has-data-[icon=inline-end]:pr-4 has-data-[icon=inline-start]:pl-4',
				xs: "h-auto gap-1 rounded-[2px] px-2.5 py-1.5 text-[10px] tracking-[0.1em] has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2 [&_svg:not([class*='size-'])]:size-3",
				sm: "h-auto gap-1.5 rounded-[2px] px-3.5 py-2 text-[11px] tracking-[0.12em] has-data-[icon=inline-end]:pr-2.5 has-data-[icon=inline-start]:pl-2.5 [&_svg:not([class*='size-'])]:size-3.5",
				lg: 'h-auto gap-2 px-6 py-3.5 has-data-[icon=inline-end]:pr-5 has-data-[icon=inline-start]:pl-5',
				icon: 'size-10 rounded-full',
				'icon-xs': "size-6 rounded-full [&_svg:not([class*='size-'])]:size-3",
				'icon-sm': 'size-8 rounded-full',
				'icon-lg': 'size-11 rounded-full'
			}
		},
		defaultVariants: {
			variant: 'default',
			size: 'default'
		}
	});

	export type ButtonVariant = VariantProps<typeof buttonVariants>['variant'];
	export type ButtonSize = VariantProps<typeof buttonVariants>['size'];

	export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
		WithElementRef<HTMLAnchorAttributes> & {
			variant?: ButtonVariant;
			size?: ButtonSize;
		};
</script>

<script lang="ts">
	let {
		class: className,
		variant = 'default',
		size = 'default',
		ref = $bindable(null),
		href = undefined,
		type = 'button',
		disabled,
		children,
		...restProps
	}: ButtonProps = $props();
</script>

{#if href}
	<a
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		href={disabled ? undefined : href}
		aria-disabled={disabled}
		role={disabled ? 'link' : undefined}
		tabindex={disabled ? -1 : undefined}
		{...restProps}
	>
		{@render children?.()}
	</a>
{:else}
	<button
		bind:this={ref}
		data-slot="button"
		class={cn(buttonVariants({ variant, size }), className)}
		{type}
		{disabled}
		{...restProps}
	>
		{@render children?.()}
	</button>
{/if}
