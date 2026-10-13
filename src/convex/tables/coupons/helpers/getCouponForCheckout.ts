import { ConvexError } from 'convex/values';
import { COUPONS_CONFIG } from '../../../../shared/features/coupons/config.js';
import { CART_CONFIG } from '../../../../shared/features/cart/config.js';
import { normalizeCouponCode } from '../../../../shared/features/coupons/utils/normalizeCouponCode.js';
import { calculateCouponDiscountMinor } from '../../../../shared/features/coupons/utils/calculateCouponDiscountMinor.js';
import { formatMoneyMinor } from '../../../../utils/formatters.js';
import type { QueryCtx } from '../../../_generated/server.js';

export async function getCouponForCheckout(
	ctx: Pick<QueryCtx, 'db'>,
	options: {
		code: string;
		subtotalMinor: number;
		discountSubtotalMinor: number;
		userId: string | null;
		customerRef?: string;
		email: string;
		now: number;
	}
) {
	const fail = (code: string, message: string): never => {
		throw new ConvexError({ code, message });
	};
	if (!COUPONS_CONFIG.HAS_COUPONS) fail('COUPONS_DISABLED', 'Los cupones no están disponibles.');
	if (COUPONS_CONFIG.COUPONS_REQUIRE_SIGN_IN && !options.userId) {
		fail('COUPON_SIGN_IN_REQUIRED', 'Inicia sesión para usar un cupón.');
	}
	const code = normalizeCouponCode(options.code);
	const coupon = await ctx.db
		.query('coupons')
		.withIndex('by_code', (q) => q.eq('code', code))
		.unique();
	if (!coupon) return fail('COUPON_NOT_FOUND', 'No encontramos ese cupón.');
	if (!coupon.active) fail('COUPON_INACTIVE', 'Este cupón está desactivado.');
	if (coupon.expiresAt !== undefined && options.now > coupon.expiresAt) {
		fail('COUPON_EXPIRED', 'Este cupón ha vencido.');
	}
	if (coupon.minSubtotalMinor !== undefined && options.subtotalMinor < coupon.minSubtotalMinor) {
		fail(
			'COUPON_MIN_SUBTOTAL',
			`Este cupón requiere una compra mínima de ${formatMoneyMinor(coupon.minSubtotalMinor, CART_CONFIG.CURRENCY)}.`
		);
	}
	// shortcut: limits count paid orders, reserve uses if simultaneous pending checkouts need hard caps.
	if (coupon.maxRedemptions !== undefined && coupon.redemptionCount >= coupon.maxRedemptions) {
		fail('COUPON_USAGE_LIMIT_REACHED', 'Este cupón alcanzó su límite de usos.');
	}
	if (coupon.onePerCustomer) {
		const email = options.email.trim().toLowerCase();
		if (!email)
			fail('COUPON_EMAIL_REQUIRED', 'Ingresa tu correo electrónico antes de aplicar el cupón.');
		const [byEmail, byUser, byDevice] = await Promise.all([
			ctx.db
				.query('orders')
				.withIndex('by_coupon_email_settled', (q) =>
					q.eq('couponId', coupon._id).eq('couponEmail', email).gt('settledAt', 0)
				)
				.first(),
			options.userId
				? ctx.db
						.query('orders')
						.withIndex('by_coupon_user_settled', (q) =>
							q.eq('couponId', coupon._id).eq('userId', options.userId).gt('settledAt', 0)
						)
						.first()
				: null,
			!options.userId && options.customerRef
				? ctx.db
						.query('orders')
						.withIndex('by_coupon_customer_settled', (q) =>
							q
								.eq('couponId', coupon._id)
								.eq('couponCustomerRef', options.customerRef)
								.gt('settledAt', 0)
						)
						.first()
				: null
		]);
		if (byEmail || byUser || byDevice) fail('COUPON_ALREADY_USED', 'Ya usaste este cupón.');
	}
	return {
		coupon,
		discountMinor: calculateCouponDiscountMinor(options.discountSubtotalMinor, coupon.percentOff)
	};
}
