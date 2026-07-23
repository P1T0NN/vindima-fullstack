// TEMP — UI preview only. Hand-built dashboard data so `/admin/dashboard` renders every zone
// without real orders/analytics, for eyeballing the layout. Gated behind `USE_MOCK` in
// `+page.svelte`; delete this file and the flag once the look is settled. No DB writes.

// TYPES
import type { DashboardPayload, DashboardPeriod } from '@/shared/features/orders/types/ordersTypes';

const DAY_MS = 86_400_000;
const HOUR_MS = 3_600_000;

/** Points per period, matching the real query's bucketing (hourly for "today", else daily). */
const POINTS: Record<DashboardPeriod, number> = { today: 12, '7d': 7, '30d': 30, '90d': 90 };

/** Deterministic organic-looking series (no RNG, so it doesn't flicker on re-render). */
function mockSeries(period: DashboardPeriod): DashboardPayload['revenueSeries'] {
	const isToday = period === 'today';
	const count = POINTS[period];
	const step = isToday ? HOUR_MS : DAY_MS;
	// Anchor to a fixed epoch so labels are stable; recent enough to read naturally.
	const end = 1_753_000_000_000; // ~2025-07
	const start = end - (count - 1) * step;
	return Array.from({ length: count }, (_, i) => {
		const wave = Math.sin(i / 3) * 0.4 + Math.sin(i / 7) * 0.3;
		const valueMinor = Math.max(0, Math.round((1 + wave + (i % 5) * 0.15) * 45_000));
		return { t: start + i * step, valueMinor };
	});
}

export function createMockDashboard(period: DashboardPeriod): DashboardPayload {
	const revenueSeries = mockSeries(period);
	const revenueMinor = revenueSeries.reduce((sum, p) => sum + p.valueMinor, 0);

	return {
		// Non-zero so both alert cards render (set both to 0 to preview the all-clear line).
		ordersCounts: { pendingCount: 3, toFulfillCount: 2 },
		kpis: {
			current: { revenueMinor, ordersCount: 38, refundsMinor: 34_000, newCustomers: 9 },
			// Previous period: drives the delta chips — ventas ▲, pedidos ▲, clientes ▼ (bad),
			// reembolsos ▲ (bad, inverted → red), ticket promedio neutral.
			previous: {
				revenueMinor: Math.round(revenueMinor / 1.12),
				ordersCount: 36,
				refundsMinor: 20_000,
				newCustomers: 12
			}
		},
		revenueSeries,
		topProducts: [
			{ name: 'Tabla de quesos', revenueMinor: 420_000 },
			{ name: 'Hogaza de masa madre', revenueMinor: 310_000 },
			{ name: 'Vino tinto de autor', revenueMinor: 190_000 },
			{ name: 'Bowl de temporada', revenueMinor: 120_000 },
			{ name: 'Tapas para picar', revenueMinor: 80_000 }
		],
		categoryRevenue: [
			{ name: 'Tablas', revenueMinor: 520_000 },
			{ name: 'Hogazas', revenueMinor: 360_000 },
			{ name: 'Vinos de autor', revenueMinor: 240_000 },
			{ name: 'Bowls', revenueMinor: 150_000 },
			{ name: 'Tapas', revenueMinor: 95_000 },
			{ name: 'Bebidas', revenueMinor: 60_000 }
		],
		currency: 'MXN'
	};
}
