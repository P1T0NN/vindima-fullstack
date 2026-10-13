# Coupon codes

Coupon management lives at `/admin/coupons`. Administrators can create percentage-off
codes, enable or disable them, and delete them with confirmation. The list shows the
code, percentage, status, expiry, and paid redemption count.

`src/shared/features/coupons/config.ts` controls availability, optional sign-in, and
validation limits. Codes are trimmed and uppercased. Discounts range from 1% to 99%.
Optional rules are a minimum merchandise subtotal, expiry at the end of a UTC date,
maximum paid redemptions, and one use per account, guest device, or checkout email.

Checkout previews are validated by the backend. Changing the subtotal, welcome offer,
email, or authentication state invalidates the displayed preview. Placement rechecks
every rule against server-priced products. The minimum spend uses the merchandise
subtotal before discounts; the coupon percentage applies after any welcome discount.
Free loyalty items remain free and do not contribute to the discountable subtotal.
Shipping and stamps use the subtotal after both discounts.

Orders snapshot the coupon code, ID, normalized redemption email, guest device reference,
and discount amount. Guest identity persists independently of checkout attempts; if browser
storage is unavailable, the email check still applies.
Existing orders without coupon fields remain valid. Draft edits invalidate an existing
payment session when the coupon or its price changes. Stripe receives the combined
welcome and coupon discount as one fixed-amount discount. Receipts, order confirmation,
customer history, and admin order details show the coupon discount.

Paid settlement increments the coupon count once. Refunding an order does not restore
its coupon use. Disabling or deleting a coupon does not rewrite existing orders or
invalidate payments already accepted at their snapshotted price. As in the reference
implementation, limits check paid orders at placement rather than reserving uses:
simultaneous pending checkouts can exceed a redemption or customer limit. Hard caps
across pending payments would require reserved uses and expiry/release handling.

The checkout coupon component accepts a validation callback and has no Convex dependency.
The checkout summary supplies the application adapter. Admin actions use the existing
admin-authorized, rate-limited mutation builder.

Validation: `bun tests/coupons.check.ts`, `bun run check`, and `bun run build`.
Deploy the backend with `bunx convex dev --once` after authenticating to the configured
development project. No production deployment is implied by the implementation.
