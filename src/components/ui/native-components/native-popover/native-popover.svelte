<script lang="ts">
	// UTILS
	import { cn } from '@/utils/utils.js';

	// TYPES
	import type { Snippet } from 'svelte';

	// Native Popover API: the browser handles open/close, light-dismiss on
	// outside click, and Esc. Positioning uses CSS anchor positioning, so no
	// JS lib needed. The trigger button sets `popovertarget`; the panel is the
	// `[popover]` element anchored below it.
	let {
		id,
		trigger,
		children,
		class: className,
		align = 'end',
	}: {
		id: string;
		trigger: Snippet;
		children: Snippet;
		class?: string;
		align?: 'start' | 'end';
	} = $props();
</script>

<button
	popovertarget={id}
	aria-haspopup="menu"
	style={`anchor-name: --np-${id}`}
	class="cursor-pointer appearance-none rounded-full p-0 outline-none transition-transform active:scale-95 focus-visible:ring-3 focus-visible:ring-ring/40"
>
	{@render trigger?.()}
</button>

<div
	id={id}
	popover="auto"
	style={`position-anchor: --np-${id}; position-area: ${align === 'end' ? 'bottom right' : 'bottom left'}`}
	class={cn(
		'm-0 mt-2 min-w-52 rounded-2xl border bg-popover p-1 text-popover-foreground shadow-lg',
		className
	)}
>
	{@render children?.()}
</div>
