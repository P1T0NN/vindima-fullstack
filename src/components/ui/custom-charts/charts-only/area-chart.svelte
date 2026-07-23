<script lang="ts">
    // LIBRARIES
	import { Area, AreaChart } from 'layerchart';
	import { scaleUtc } from 'd3-scale';
	import { curveLinear, curveMonotoneX, curveNatural, curveStep } from 'd3-shape';

	// COMPONENTS
	import * as Card from '@/components/ui/card/index.js';
	import * as Chart from '@/components/ui/chart/index.js';

	// UTILS
	import { defaultXAxisFormat, defaultLabelFormatter } from '../utils/chartUtils';
	
	// TYPES
	import type { Snippet, Component, ComponentProps } from 'svelte';
	import type { ChartConfig } from '@/components/ui/chart/chart-utils.js';
	
	// LUCIDE ICONS
	import TrendingUpIcon from '@lucide/svelte/icons/trending-up';

	// ─── Curve map ───────────────────────────────────────────────────────────────

	const CURVES = {
		monotone: curveMonotoneX,
		natural: curveNatural,
		linear: curveLinear,
		step: curveStep
	} as const;

	type CurveType = keyof typeof CURVES;

	// ─── Presets ─────────────────────────────────────────────────────────────────

	type AreaPreset = 'default' | 'linear' | 'step' | 'legend' | 'stacked' | 'stacked-expanded';
	type LayerAreaProps = Partial<ComponentProps<typeof Area>>;
	type LayerAreaChartProps = {
		area?: LayerAreaProps;
		[key: string]: unknown;
	};
	type AreaSeries = {
		key: string;
		color?: string;
		props?: LayerAreaProps;
	};
	type AreaChartSnippetParams = {
		context: {
			series: {
				visibleSeries: AreaSeries[];
			};
		};
	};

	interface PresetConfig {
		curve: CurveType;
		layout: 'single' | 'stack' | 'stackExpand';
		showLegend: boolean;
		tooltipHideLabel: boolean;
		tooltipIndicator?: 'dot' | 'line' | 'dashed';
	}

	const PRESETS: Record<AreaPreset, PresetConfig> = {
		default: {
			curve: 'monotone',
			layout: 'single',
			showLegend: false,
			tooltipHideLabel: false,
			tooltipIndicator: 'line'
		},
		linear: {
			curve: 'linear',
			layout: 'stack',
			showLegend: false,
			tooltipHideLabel: true
		},
		step: {
			curve: 'step',
			layout: 'stack',
			showLegend: false,
			tooltipHideLabel: true
		},
		legend: {
			curve: 'monotone',
			layout: 'stack',
			showLegend: true,
			tooltipHideLabel: false,
			tooltipIndicator: 'line'
		},
		stacked: {
			curve: 'monotone',
			layout: 'stack',
			showLegend: false,
			tooltipHideLabel: false,
			tooltipIndicator: 'dot'
		},
		'stacked-expanded': {
			curve: 'monotone',
			layout: 'stackExpand',
			showLegend: false,
			tooltipHideLabel: false,
			tooltipIndicator: 'line'
		}
	};

	// ─── Props ───────────────────────────────────────────────────────────────────

	let {
		data,
		x,
		config,
		// Preset + overrides
		preset = 'default' as AreaPreset,
		curve: curveOverride,
		layout: layoutOverride,
		showLegend: showLegendOverride,
		tooltipHideLabel: tooltipHideLabelOverride,
		tooltipIndicator: tooltipIndicatorOverride,
		// Axis
		axis = 'x',
		xAxisFormat,
		yAxisFormat,
		yDomain,
		yPadding,
		// Area
		fillOpacity = 0.4,
		// Tooltip
		tooltipLabelFormatter,
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
		areaChartProps,
		// Snippets
		customMarks: userMarks,
		tooltip: userTooltip
	}: {
		data: Record<string, unknown>[];
		x: string;
		config: ChartConfig;
		preset?: AreaPreset;
		curve?: CurveType;
		layout?: 'single' | 'stack' | 'stackExpand';
		showLegend?: boolean;
		tooltipHideLabel?: boolean;
		tooltipIndicator?: 'dot' | 'line' | 'dashed';
		axis?: 'x' | 'y' | 'both' | false;
		xAxisFormat?: (v: unknown) => string;
		yAxisFormat?: (v: unknown) => string;
		yDomain?: [number, number];
		yPadding?: [number, number];
		fillOpacity?: number;
		tooltipLabelFormatter?: (v: unknown) => string;
		tooltipNameKey?: string;
		title?: string;
		description?: string;
		cardClass?: string;
		cardContentClass?: string;
		containerClass?: string;
		footerTrend?: string;
		footerTrendIcon?: Component;
		footerDateRange?: string;
		areaChartProps?: LayerAreaChartProps;
		customMarks?: Snippet<[AreaChartSnippetParams]>;
		tooltip?: Snippet;
	} = $props();

	const p = $derived(PRESETS[preset] ?? PRESETS.default);

	const resolvedCurve = $derived(CURVES[curveOverride ?? p.curve]);
	const resolvedLayout = $derived(layoutOverride ?? p.layout);
	const resolvedShowLegend = $derived(showLegendOverride ?? p.showLegend);
	const resolvedTooltipHideLabel = $derived(tooltipHideLabelOverride ?? p.tooltipHideLabel);
	const resolvedTooltipIndicator = $derived(tooltipIndicatorOverride ?? p.tooltipIndicator);
	// layerchart shows both axes with `true`; map our friendlier 'both' onto it.
	const resolvedAxis = $derived(axis === 'both' ? true : axis);
	const resolvedAreaProps = $derived({
		curve: resolvedCurve,
		fillOpacity,
		line: { class: 'stroke-1' },
		motion: 'tween',
		...areaChartProps?.area
	} satisfies LayerAreaProps);

	// Auto-build series from config keys
	const seriesKeys = $derived(Object.keys(config).filter((k) => k in (data[0] ?? {})));
	const series = $derived(
		seriesKeys.map((key) => {
			const cfg = config[key] as { label?: string; color?: string } | undefined;
			return {
				key,
				label: cfg?.label ?? key,
				color: cfg?.color ?? `var(--chart-1)`
			};
		})
	);
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
			<AreaChart
				{data}
				{x}
				{series}
				axis={resolvedAxis}
				xScale={scaleUtc()}
				seriesLayout={resolvedLayout === 'single' ? undefined : resolvedLayout}
				legend={resolvedShowLegend ? true : undefined}
				{yDomain}
				{yPadding}
				props={{
					xAxis: {
						format: xAxisFormat ?? defaultXAxisFormat
					},
					yAxis: {
						format: yAxisFormat
					},
					...areaChartProps,
					area: resolvedAreaProps
				}}
			>
				{#snippet marks(snippetParams: AreaChartSnippetParams)}
					{#if userMarks}
						{@render userMarks(snippetParams)}
					{:else}
						{#each snippetParams.context.series.visibleSeries as s (s.key)}
							<Area seriesKey={s.key} {...resolvedAreaProps} {...s.props} />
						{/each}
					{/if}
				{/snippet}

				{#snippet tooltip()}
					{#if userTooltip}
						{@render userTooltip()}
					{:else}
						<Chart.Tooltip
							hideLabel={resolvedTooltipHideLabel}
							indicator={resolvedTooltipIndicator}
							labelFormatter={tooltipLabelFormatter ?? defaultLabelFormatter}
							nameKey={tooltipNameKey}
						/>
					{/if}
				{/snippet}
			</AreaChart>
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
