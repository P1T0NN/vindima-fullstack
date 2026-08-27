import { AnalyticsClient } from '@vllnt/convex-analytics';
import { components } from '../_generated/api';

export const analytics = new AnalyticsClient(components.analytics, {
	granularities: ['day'],
	sampleRate: 1
});
