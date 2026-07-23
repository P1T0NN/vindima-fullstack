<script lang="ts">
	import { BarChart, Bars } from 'layerchart';
	import { scaleBand } from 'd3-scale';
	import { cubicInOut } from 'svelte/easing';
	import * as Card from '@/components/ui/card/index.js';
	import * as Chart from '@/components/ui/chart/index.js';
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';
	import type { Snippet, Component, ComponentProps } from 'svelte';
	import type { ChartConfig } from '@/components/ui/chart/chart-utils.js';

	// ─── Presets ─────────────────────────────────────────────────────────────────

	type BarPreset = 'default' | 'horizontal' | 'multiple' | 'stacked' | 'label' | 'negative';
	type LayerBarsProps = Partial<ComponentProps<typeof Bars>>;
	type LayerBarChartProps = {
		bars?: LayerBarsProps;
		[key: string]: unknown;
	};
	type BarSeries = {
		key: string;
		props?: LayerBarsProps;
	};
	type BarChartSnippetParams = {
		context: {
			series: {
				visibleSeries: BarSeries[];
				isHighlighted: (seriesKey: string, defaultValue?: boolean) => boolean;
			};
		};
	};

	interface PresetConfig {
		orientation: 'vertical' | 'horizontal';
		radius: number;
		rounded: 'all' | 'bottom' | 'none';
		grid: boolean;
		rule: boolean;
		layout: 'single' | 'group' | 'stack';
		showLabels: boolean;
		showLegend: boolean;
	}

	const PRESETS: Record<BarPreset, PresetConfig> = {
		default: {
			orientation: 'vertical',
			radius: 8,
			rounded: 'all',
			grid: true,
			rule: true,
			layout: 'single',
			showLabels: false,
			showLegend: false
		},
		horizontal: {
			orientation: 'horizontal',
			radius: 5,
			rounded: 'all',
			grid: false,
			rule: false,
			layout: 'single',
			showLabels: false,
			showLegend: false
		},
		multiple: {
			orientation: 'vertical',
			radius: 0,
			rounded: 'all',
			grid: true,
			rule: false,
			layout: 'group',
			showLabels: false,
			showLegend: false
		},
		stacked: {
			orientation: 'vertical',
			radius: 0,
			rounded: 'bottom',
			grid: true,
			rule: false,
			layout: 'stack',
			showLabels: false,
			showLegend: true
		},
		label: {
			orientation: 'vertical',
			radius: 8,
			rounded: 'all',
			grid: true,
			rule: false,
			layout: 'single',
			showLabels: true,
			showLegend: false
		},
		negative: {
			orientation: 'vertical',
			radius: 0,
			rounded: 'none',
			grid: true,
			rule: true,
			layout: 'single',
			showLabels: false,
			showLegend: false
		}
	};

	// ─── Props ───────────────────────────────────────────────────────────────────

	let {
		data,
		x,
		y,
		config,
		// Preset + overrides
		preset = 'default' as BarPreset,
		orientation: orientationOverride,
		radius: radiusOverride,
		rounded: roundedOverride,
		grid: gridOverride,
		rule: ruleOverride,
		layout: layoutOverride,
		showLabels: showLabelsOverride,
		labelsOffset = 12,
		labelFormat,
		labelPlacement = 'outside',
		showLegend: showLegendOverride,
		// Colors
		colorKey = 'color',
		cRange,
		colorFn,
		// Scale
		padding,
		// Layout options
		barPaddingInner = 0.2,
		insetLeft,
		// Axis
		axis,
		xAxisFormat,
		yAxisFormat,
		yBaseline,
		yNice,
		valueDomain,
		// Tooltip
		tooltipHideLabel = true,
		tooltipIndicator,
		tooltipNameKey,
		// Card
		title,
		description,
		cardClass,
		cardContentClass,
		containerClass,
		// Footer
		footerTrend,
		footerTrendIcon,
		footerDateRange,
		// Extra props
		barChartProps,
		// Snippets
		belowMarks: userBelowMarks,
		customMarks: userMarks,
		tooltip: userTooltip
	}: {
		data: Record<string, unknown>[];
		x: string;
		y?: string;
		config: ChartConfig;
		preset?: BarPreset;
		orientation?: 'vertical' | 'horizontal';
		radius?: number;
		rounded?: 'all' | 'bottom' | 'none';
		grid?: boolean;
		rule?: boolean;
		layout?: 'single' | 'group' | 'stack';
		showLabels?: boolean;
		labelsOffset?: number;
		/** Formats the value label rendered on each bar (e.g. money). */
		labelFormat?: (value: unknown) => string;
		labelPlacement?: 'inside' | 'outside' | 'center';
		showLegend?: boolean;
		colorKey?: string;
		cRange?: string[];
		colorFn?: (d: Record<string, unknown>) => string;
		padding?: Record<string, number>;
		barPaddingInner?: number;
		insetLeft?: number;
		axis?: 'x' | 'y' | false;
		xAxisFormat?: (d: unknown) => string;
		yAxisFormat?: (d: unknown) => string;
		yBaseline?: number;
		yNice?: number;
		/** Explicit domain for the VALUE axis (x when horizontal, y when vertical). Use to add
		 *  headroom so outside value labels don't overflow, e.g. [0, max * 1.25]. */
		valueDomain?: [number, number];
		tooltipHideLabel?: boolean;
		tooltipIndicator?: 'dot' | 'line' | 'dashed';
		tooltipNameKey?: string;
		title?: string;
		description?: string;
		cardClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		footerTrend?: string;
		footerTrendIcon?: Component;
		footerDateRange?: string;
		barChartProps?: LayerBarChartProps;
		belowMarks?: Snippet;
		customMarks?: Snippet<[BarChartSnippetParams]>;
		tooltip?: Snippet;
	} = $props();

	// ─── Derived values ──────────────────────────────────────────────────────────

	const p = $derived(PRESETS[preset] ?? PRESETS.default);

	const resolvedOrientation = $derived(orientationOverride ?? p.orientation);
	const resolvedRadius = $derived(radiusOverride ?? p.radius);
	const resolvedRounded = $derived(roundedOverride ?? p.rounded);
	const resolvedGrid = $derived(gridOverride ?? p.grid);
	const resolvedRule = $derived(ruleOverride ?? p.rule);
	const resolvedLayout = $derived(layoutOverride ?? p.layout);
	const resolvedShowLabels = $derived(showLabelsOverride ?? p.showLabels);
	const resolvedShowLegend = $derived(showLegendOverride ?? p.showLegend);
	const resolvedAxis = $derived(axis ?? (resolvedOrientation === 'horizontal' ? 'y' : 'x'));

	const isHorizontal = $derived(resolvedOrientation === 'horizontal');

	// Auto-build series from config keys
	const seriesKeys = $derived(Object.keys(config).filter((k) => k in (data[0] ?? {})));
	const series = $derived(
		seriesKeys.map((key) => {
			const cfg = config[key] as { label?: string; color?: string } | undefined;
			return {
				key,
				label: cfg?.label ?? key,
				color: cfg?.color,
				props:
					resolvedLayout === 'stack' && key !== seriesKeys[seriesKeys.length - 1]
						? { rounded: resolvedRounded }
						: undefined
			};
		})
	);

	const primaryScale = $derived(scaleBand().padding(0.25));
	const groupScale = $derived(scaleBand().paddingInner(barPaddingInner));

	const chartX = $derived(isHorizontal ? y : x);
	const chartY = $derived(isHorizontal ? x : y);
	const hasColorKey = $derived(Boolean(colorKey && data.some((d) => d[colorKey] != null)));
	const resolvedColorAccessor = $derived(colorFn ?? (hasColorKey ? colorKey : undefined));
	const resolvedCRange = $derived(
		cRange ?? (hasColorKey && !colorFn ? data.map((d) => String(d[colorKey])) : undefined)
	);
	const resolvedColorProps = $derived.by(() => {
		const props: { c?: string | ((d: Record<string, unknown>) => string); cRange?: string[] } = {};

		if (resolvedColorAccessor) {
			props.c = resolvedColorAccessor;
		}
		if (resolvedCRange) {
			props.cRange = resolvedCRange;
		}

		return props;
	});

	const defaultFormat = (d: unknown) => String(d ?? '').slice(0, 3);

	const labels = $derived(
		resolvedShowLabels
			? { offset: labelsOffset, placement: labelPlacement, format: labelFormat }
			: undefined
	);
	const resolvedBarsProps = $derived({
		stroke: 'none',
		radius: resolvedRadius,
		rounded: resolvedRounded,
		motion: { type: 'tween', duration: 500, easing: cubicInOut },
		insets: insetLeft ? { left: insetLeft } : undefined,
		...barChartProps?.bars
	} satisfies LayerBarsProps);
</script>

<Card.Root class={cardClass}>
	{#if title || description}
		<Card.Header>
			{#if title}
				<Card.Title>{title}</Card.Title>
			{/if}
			{#if description}
				<Card.Description>{description}</Card.Description>
			{/if}
		</Card.Header>
	{/if}

	<Card.Content class={cardContentClass}>
		<Chart.Container {config} class={containerClass}>
			<BarChart
				{data}
				x={chartX}
				y={chartY}
				{series}
				orientation={resolvedOrientation}
				xScale={isHorizontal ? undefined : primaryScale}
				yScale={isHorizontal ? primaryScale : undefined}
				seriesLayout={resolvedLayout === 'single' ? undefined : resolvedLayout}
				x1Scale={!isHorizontal && resolvedLayout === 'group' ? groupScale : undefined}
				y1Scale={isHorizontal && resolvedLayout === 'group' ? groupScale : undefined}
				{padding}
				axis={resolvedAxis}
				grid={resolvedGrid}
				rule={resolvedRule}
				{labels}
				legend={resolvedShowLegend ? true : undefined}
				{...resolvedColorProps}
				xBaseline={isHorizontal ? yBaseline : undefined}
				yBaseline={isHorizontal ? undefined : yBaseline}
				xNice={isHorizontal ? yNice : undefined}
				yNice={isHorizontal ? undefined : yNice}
				xDomain={isHorizontal ? valueDomain : undefined}
				yDomain={isHorizontal ? undefined : valueDomain}
				props={{
					highlight: { area: { fill: 'none' } },
					xAxis: {
						format: xAxisFormat ?? (resolvedOrientation === 'vertical' ? defaultFormat : undefined)
					},
					yAxis: {
						format:
							yAxisFormat ?? (resolvedOrientation === 'horizontal' ? defaultFormat : undefined)
					},
					...barChartProps,
					bars: resolvedBarsProps
				}}
			>
				{#snippet belowMarks()}
					{#if userBelowMarks}
						{@render userBelowMarks()}
					{/if}
				{/snippet}

				{#snippet marks(snippetParams: BarChartSnippetParams)}
					{#if userMarks}
						{@render userMarks(snippetParams)}
					{:else}
						{#each snippetParams.context.series.visibleSeries as s (s.key)}
							<Bars
								seriesKey={s.key}
								x1={!isHorizontal && resolvedLayout === 'group' ? () => s.key : undefined}
								y1={isHorizontal && resolvedLayout === 'group' ? () => s.key : undefined}
								opacity={snippetParams.context.series.isHighlighted(s.key, true) ? 1 : 0.1}
								{...resolvedBarsProps}
								{...s.props}
							/>
						{/each}
					{/if}
				{/snippet}

				{#snippet tooltip()}
					{#if userTooltip}
						{@render userTooltip()}
					{:else}
						<Chart.Tooltip
							hideLabel={tooltipHideLabel}
							indicator={tooltipIndicator}
							nameKey={tooltipNameKey}
						/>
					{/if}
				{/snippet}
			</BarChart>
		</Chart.Container>
	</Card.Content>

	{#if footerTrend || footerDateRange}
		<Card.Footer>
			<div class="flex w-full items-start gap-2 text-sm">
				<div class="grid gap-2">
					{#if footerTrend}
						<div class="flex items-center gap-2 leading-none font-medium">
							{footerTrend}
							{#if footerTrendIcon}
								<footerTrendIcon class="size-4"></footerTrendIcon>
							{:else}
								<TrendingUpIcon class="size-4"></TrendingUpIcon>
							{/if}
						</div>
					{/if}
					{#if footerDateRange}
						<div class="flex items-center gap-2 leading-none text-muted-foreground">
							{footerDateRange}
						</div>
					{/if}
				</div>
			</div>
		</Card.Footer>
	{/if}
</Card.Root>
