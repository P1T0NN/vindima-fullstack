/**
 * Page-number window with elision: `[1, 'gap', 4, 5, 6, 'gap', 10]`.
 *
 * Always includes the first and last page (so a crawler reaches both ends of the list from
 * any page) plus `span` neighbours either side of the current one. `'gap'` marks a skipped
 * run; consecutive runs never produce a gap, so a short list renders as plain `1 2 3`.
 *
 * Only meaningful when a total is known — cursor pagination has no last page, so callers
 * render prev/next only.
 */
export function pageWindow(current: number, total: number, span = 1): (number | 'gap')[] {
	if (!Number.isFinite(total) || total <= 0) return [];
	const clamped = Math.min(Math.max(1, Math.floor(current)), total);

	const pages = new Set<number>([1, total]);
	for (let p = clamped - span; p <= clamped + span; p++) {
		if (p >= 1 && p <= total) pages.add(p);
	}

	const sorted = [...pages].sort((a, b) => a - b);
	const out: (number | 'gap')[] = [];
	for (const [i, p] of sorted.entries()) {
		if (i > 0 && p - sorted[i - 1]! > 1) out.push('gap');
		out.push(p);
	}
	return out;
}

// Self-check lives in `./paginatedDataUtils.check.ts` — this repo's convention (a separate
// runnable file), not the template's inline `import.meta.main` block, which `svelte-check`
// rejects because `ImportMeta.main` is a Bun-only property.
