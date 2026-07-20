// LIBRARIES
import { useQuery } from '@mmailaender/convex-svelte';
import { api } from '@/convex/_generated/api';

// TYPES
import type { FunctionArgs } from 'convex/server';

type AnalyticsTimeSeriesQuery = typeof api.analytics.queries.analyticsQueries.timeSeries;
type AnalyticsBreakdownQuery = typeof api.analytics.queries.analyticsQueries.breakdown;
type AnalyticsSummaryQuery = typeof api.analytics.queries.analyticsQueries.summary;

export type AnalyticsQueryArgsSource<Args> = Args | 'skip' | (() => Args | 'skip');
export type AnalyticsTimeSeriesQueryArgs = FunctionArgs<AnalyticsTimeSeriesQuery>;
export type AnalyticsBreakdownQueryArgs = FunctionArgs<AnalyticsBreakdownQuery>;
export type AnalyticsSummaryQueryArgs = FunctionArgs<AnalyticsSummaryQuery>;

export const useAnalytics = {
	timeSeries(args: AnalyticsQueryArgsSource<AnalyticsTimeSeriesQueryArgs>) {
		return useQuery(api.analytics.queries.analyticsQueries.timeSeries, args);
	},
	breakdown(args: AnalyticsQueryArgsSource<AnalyticsBreakdownQueryArgs>) {
		return useQuery(api.analytics.queries.analyticsQueries.breakdown, args);
	},
	summary(args: AnalyticsQueryArgsSource<AnalyticsSummaryQueryArgs>) {
		return useQuery(api.analytics.queries.analyticsQueries.summary, args);
	}
};
