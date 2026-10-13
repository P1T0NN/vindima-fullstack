import { redirect } from '@sveltejs/kit';
import { COUPONS_CONFIG } from '@/shared/features/coupons/config.js';
import { ADMIN_PAGE_ENDPOINTS } from '@/config/pageEndpoints.js';

export function load() {
	if (!COUPONS_CONFIG.HAS_COUPONS) redirect(307, ADMIN_PAGE_ENDPOINTS.DASHBOARD);
}
