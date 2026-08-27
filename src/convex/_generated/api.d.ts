/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as aggregates_helpers_createCounterAggregate from "../aggregates/helpers/createCounterAggregate.js";
import type * as aggregates_helpers_getFilteredTotalAggregate from "../aggregates/helpers/getFilteredTotalAggregate.js";
import type * as aggregates_helpers_getTotalSizeAggregate from "../aggregates/helpers/getTotalSizeAggregate.js";
import type * as aggregates_triggersAggregate from "../aggregates/triggersAggregate.js";
import type * as aggregates_types_aggregateTypes from "../aggregates/types/aggregateTypes.js";
import type * as aggregates_utils_getPrefixRangeBoundsAggregate from "../aggregates/utils/getPrefixRangeBoundsAggregate.js";
import type * as auth from "../auth.js";
import type * as builders_convexFunctionBuilders from "../builders/convexFunctionBuilders.js";
import type * as crons from "../crons.js";
import type * as emails_data_emailData from "../emails/data/emailData.js";
import type * as emails_helpers_getOrderForEmail from "../emails/helpers/getOrderForEmail.js";
import type * as emails_helpers_getRewardEmailData from "../emails/helpers/getRewardEmailData.js";
import type * as emails_sendEmail from "../emails/sendEmail.js";
import type * as emails_sendViaResend from "../emails/sendViaResend.js";
import type * as emails_templates_authOtpEmail from "../emails/templates/authOtpEmail.js";
import type * as emails_templates_emailFooter from "../emails/templates/emailFooter.js";
import type * as emails_templates_emailHeader from "../emails/templates/emailHeader.js";
import type * as emails_templates_emailLayout from "../emails/templates/emailLayout.js";
import type * as emails_templates_newOrderOwnerEmail from "../emails/templates/newOrderOwnerEmail.js";
import type * as emails_templates_orderCancelledEmail from "../emails/templates/orderCancelledEmail.js";
import type * as emails_templates_orderPaidEmail from "../emails/templates/orderPaidEmail.js";
import type * as emails_templates_orderReceivedEmail from "../emails/templates/orderReceivedEmail.js";
import type * as emails_templates_orderRefundedEmail from "../emails/templates/orderRefundedEmail.js";
import type * as emails_templates_orderShippedEmail from "../emails/templates/orderShippedEmail.js";
import type * as emails_templates_orderSummaryTable from "../emails/templates/orderSummaryTable.js";
import type * as emails_templates_rewardExpiryWarningEmail from "../emails/templates/rewardExpiryWarningEmail.js";
import type * as emails_templates_rewardUnlockedEmail from "../emails/templates/rewardUnlockedEmail.js";
import type * as emails_types_emailTypes from "../emails/types/emailTypes.js";
import type * as functions from "../functions.js";
import type * as helpers_getPagination from "../helpers/getPagination.js";
import type * as helpers_paginateSearch from "../helpers/paginateSearch.js";
import type * as http from "../http.js";
import type * as migrations_migrations from "../migrations/migrations.js";
import type * as migrations_tables_backfillOrderAggregates from "../migrations/tables/backfillOrderAggregates.js";
import type * as migrations_tables_backfillProductAggregates from "../migrations/tables/backfillProductAggregates.js";
import type * as migrations_tables_backfillProductCategoryAggregates from "../migrations/tables/backfillProductCategoryAggregates.js";
import type * as migrations_tables_backfillProductVariantAggregates from "../migrations/tables/backfillProductVariantAggregates.js";
import type * as migrations_tables_backfillRewardLedgerAggregates from "../migrations/tables/backfillRewardLedgerAggregates.js";
import type * as rateLimits_helpers_enforceRateLimit from "../rateLimits/helpers/enforceRateLimit.js";
import type * as rateLimits_types_rateLimitTypes from "../rateLimits/types/rateLimitTypes.js";
import type * as storage_r2 from "../storage/r2.js";
import type * as stripe_actions_expireStripeSession from "../stripe/actions/expireStripeSession.js";
import type * as stripe_helpers_createCheckoutSession from "../stripe/helpers/createCheckoutSession.js";
import type * as stripe_helpers_createOneTimeCoupon from "../stripe/helpers/createOneTimeCoupon.js";
import type * as stripe_helpers_expireCheckoutSession from "../stripe/helpers/expireCheckoutSession.js";
import type * as stripe_helpers_refundPayment from "../stripe/helpers/refundPayment.js";
import type * as stripe_helpers_retrieveCheckoutSession from "../stripe/helpers/retrieveCheckoutSession.js";
import type * as stripe_helpers_verifyStripeWebhookEvent from "../stripe/helpers/verifyStripeWebhookEvent.js";
import type * as stripe_stripeClient from "../stripe/stripeClient.js";
import type * as stripe_utils_isStripeAlreadyDoneError from "../stripe/utils/isStripeAlreadyDoneError.js";
import type * as tables_cart_helpers_loadCart from "../tables/cart/helpers/loadCart.js";
import type * as tables_cart_helpers_resolveRefs from "../tables/cart/helpers/resolveRefs.js";
import type * as tables_cart_mutations_addLine from "../tables/cart/mutations/addLine.js";
import type * as tables_cart_mutations_clearCart from "../tables/cart/mutations/clearCart.js";
import type * as tables_cart_mutations_mergeGuestCart from "../tables/cart/mutations/mergeGuestCart.js";
import type * as tables_cart_mutations_setLineQty from "../tables/cart/mutations/setLineQty.js";
import type * as tables_cart_queries_getMyCart from "../tables/cart/queries/getMyCart.js";
import type * as tables_cart_queries_resolveCartProducts from "../tables/cart/queries/resolveCartProducts.js";
import type * as tables_cart_schemas_cartSchema from "../tables/cart/schemas/cartSchema.js";
import type * as tables_cart_validators_cartValidators from "../tables/cart/validators/cartValidators.js";
import type * as tables_firstPurchases_helpers_getWelcomeOfferEligibility from "../tables/firstPurchases/helpers/getWelcomeOfferEligibility.js";
import type * as tables_firstPurchases_mutations_recordFirstPurchase from "../tables/firstPurchases/mutations/recordFirstPurchase.js";
import type * as tables_firstPurchases_schemas_firstPurchasesSchema from "../tables/firstPurchases/schemas/firstPurchasesSchema.js";
import type * as tables_orders_actions_createCheckoutSession from "../tables/orders/actions/createCheckoutSession.js";
import type * as tables_orders_actions_handleStripeEvent from "../tables/orders/actions/handleStripeEvent.js";
import type * as tables_orders_actions_refundOrphanPayment from "../tables/orders/actions/refundOrphanPayment.js";
import type * as tables_orders_actions_refundStripePayment from "../tables/orders/actions/refundStripePayment.js";
import type * as tables_orders_aggregates_orderFilterAggregate from "../tables/orders/aggregates/orderFilterAggregate.js";
import type * as tables_orders_aggregates_userOrderFilterAggregate from "../tables/orders/aggregates/userOrderFilterAggregate.js";
import type * as tables_orders_counters_orderTotalCounter from "../tables/orders/counters/orderTotalCounter.js";
import type * as tables_orders_counters_userOrderTotalCounter from "../tables/orders/counters/userOrderTotalCounter.js";
import type * as tables_orders_crons_ordersCrons from "../tables/orders/crons/ordersCrons.js";
import type * as tables_orders_helpers_buildOrderSearchText from "../tables/orders/helpers/buildOrderSearchText.js";
import type * as tables_orders_helpers_calculateOrderPrice from "../tables/orders/helpers/calculateOrderPrice.js";
import type * as tables_orders_helpers_getOrderForPayment from "../tables/orders/helpers/getOrderForPayment.js";
import type * as tables_orders_helpers_isSameDraftInput from "../tables/orders/helpers/isSameDraftInput.js";
import type * as tables_orders_helpers_orderDetail from "../tables/orders/helpers/orderDetail.js";
import type * as tables_orders_helpers_orderUrls from "../tables/orders/helpers/orderUrls.js";
import type * as tables_orders_http_stripeWebhook from "../tables/orders/http/stripeWebhook.js";
import type * as tables_orders_mutations_cancelMyOrder from "../tables/orders/mutations/cancelMyOrder.js";
import type * as tables_orders_mutations_markOrderPaid from "../tables/orders/mutations/markOrderPaid.js";
import type * as tables_orders_mutations_markOrderRefunded from "../tables/orders/mutations/markOrderRefunded.js";
import type * as tables_orders_mutations_placeOrder from "../tables/orders/mutations/placeOrder.js";
import type * as tables_orders_mutations_refundOrder from "../tables/orders/mutations/refundOrder.js";
import type * as tables_orders_mutations_setFulfillment from "../tables/orders/mutations/setFulfillment.js";
import type * as tables_orders_mutations_setOrderFulfillment from "../tables/orders/mutations/setOrderFulfillment.js";
import type * as tables_orders_mutations_setPaymentSession from "../tables/orders/mutations/setPaymentSession.js";
import type * as tables_orders_mutations_settleOrder from "../tables/orders/mutations/settleOrder.js";
import type * as tables_orders_providers_manual from "../tables/orders/providers/manual.js";
import type * as tables_orders_providers_registry from "../tables/orders/providers/registry.js";
import type * as tables_orders_providers_stripe from "../tables/orders/providers/stripe.js";
import type * as tables_orders_providers_types from "../tables/orders/providers/types.js";
import type * as tables_orders_queries_fetchDashboard from "../tables/orders/queries/fetchDashboard.js";
import type * as tables_orders_queries_fetchMyLatestOrders from "../tables/orders/queries/fetchMyLatestOrders.js";
import type * as tables_orders_queries_fetchMyOrders from "../tables/orders/queries/fetchMyOrders.js";
import type * as tables_orders_queries_fetchOrder from "../tables/orders/queries/fetchOrder.js";
import type * as tables_orders_queries_fetchOrderByNumber from "../tables/orders/queries/fetchOrderByNumber.js";
import type * as tables_orders_queries_fetchOrderForAdmin from "../tables/orders/queries/fetchOrderForAdmin.js";
import type * as tables_orders_queries_fetchOrders from "../tables/orders/queries/fetchOrders.js";
import type * as tables_orders_queries_fetchOrdersCounts from "../tables/orders/queries/fetchOrdersCounts.js";
import type * as tables_orders_registerOrdersCrons from "../tables/orders/registerOrdersCrons.js";
import type * as tables_orders_schemas_ordersSchema from "../tables/orders/schemas/ordersSchema.js";
import type * as tables_orders_validators_ordersValidators from "../tables/orders/validators/ordersValidators.js";
import type * as tables_productCategories_aggregates_productCategoryFilterAggregate from "../tables/productCategories/aggregates/productCategoryFilterAggregate.js";
import type * as tables_productCategories_counters_productCategoryTotalCounter from "../tables/productCategories/counters/productCategoryTotalCounter.js";
import type * as tables_productCategories_mutations_createCategory from "../tables/productCategories/mutations/createCategory.js";
import type * as tables_productCategories_mutations_deleteCategory from "../tables/productCategories/mutations/deleteCategory.js";
import type * as tables_productCategories_mutations_editCategory from "../tables/productCategories/mutations/editCategory.js";
import type * as tables_productCategories_queries_fetchAllCategories from "../tables/productCategories/queries/fetchAllCategories.js";
import type * as tables_productCategories_queries_fetchCategoriesSafe from "../tables/productCategories/queries/fetchCategoriesSafe.js";
import type * as tables_productCategories_queries_fetchCategoryById from "../tables/productCategories/queries/fetchCategoryById.js";
import type * as tables_productCategories_queries_fetchCategoryOptions from "../tables/productCategories/queries/fetchCategoryOptions.js";
import type * as tables_productCategories_queries_fetchCategoryPage from "../tables/productCategories/queries/fetchCategoryPage.js";
import type * as tables_productCategories_schemas_productCategoriesSchema from "../tables/productCategories/schemas/productCategoriesSchema.js";
import type * as tables_productCategories_validators_productCategoriesValidators from "../tables/productCategories/validators/productCategoriesValidators.js";
import type * as tables_productVariants_aggregates_productVariantFilterAggregate from "../tables/productVariants/aggregates/productVariantFilterAggregate.js";
import type * as tables_productVariants_counters_rewardEligibleVariantTotalCounter from "../tables/productVariants/counters/rewardEligibleVariantTotalCounter.js";
import type * as tables_productVariants_mutations_setVariantRewardEligible from "../tables/productVariants/mutations/setVariantRewardEligible.js";
import type * as tables_productVariants_queries_fetchProductVariantsForSearch from "../tables/productVariants/queries/fetchProductVariantsForSearch.js";
import type * as tables_productVariants_queries_fetchRewardItems from "../tables/productVariants/queries/fetchRewardItems.js";
import type * as tables_productVariants_queries_fetchRewardProducts from "../tables/productVariants/queries/fetchRewardProducts.js";
import type * as tables_productVariants_schemas_productVariantsSchema from "../tables/productVariants/schemas/productVariantsSchema.js";
import type * as tables_productVariants_validators_productVariantsValidators from "../tables/productVariants/validators/productVariantsValidators.js";
import type * as tables_products_aggregates_productFilterAggregate from "../tables/products/aggregates/productFilterAggregate.js";
import type * as tables_products_counters_productTotalCounter from "../tables/products/counters/productTotalCounter.js";
import type * as tables_products_helpers_attachVariants from "../tables/products/helpers/attachVariants.js";
import type * as tables_products_helpers_getProductSlug from "../tables/products/helpers/getProductSlug.js";
import type * as tables_products_helpers_getProductsPage from "../tables/products/helpers/getProductsPage.js";
import type * as tables_products_helpers_resolveImageUrls from "../tables/products/helpers/resolveImageUrls.js";
import type * as tables_products_mutations_createProduct from "../tables/products/mutations/createProduct.js";
import type * as tables_products_mutations_deleteProduct from "../tables/products/mutations/deleteProduct.js";
import type * as tables_products_mutations_editProduct from "../tables/products/mutations/editProduct.js";
import type * as tables_products_mutations_setProductStatus from "../tables/products/mutations/setProductStatus.js";
import type * as tables_products_queries_fetchAllProducts from "../tables/products/queries/fetchAllProducts.js";
import type * as tables_products_queries_fetchProductById from "../tables/products/queries/fetchProductById.js";
import type * as tables_products_queries_fetchProductsForSearch from "../tables/products/queries/fetchProductsForSearch.js";
import type * as tables_products_schemas_productsSchema from "../tables/products/schemas/productsSchema.js";
import type * as tables_products_validators_productsValidators from "../tables/products/validators/productsValidators.js";
import type * as tables_rewardAccounts_crons_rewardAccountsCrons from "../tables/rewardAccounts/crons/rewardAccountsCrons.js";
import type * as tables_rewardAccounts_helpers_applyConfirmedStamp from "../tables/rewardAccounts/helpers/applyConfirmedStamp.js";
import type * as tables_rewardAccounts_helpers_getRewardsSnapshot from "../tables/rewardAccounts/helpers/getRewardsSnapshot.js";
import type * as tables_rewardAccounts_helpers_loadOrCreateAccount from "../tables/rewardAccounts/helpers/loadOrCreateAccount.js";
import type * as tables_rewardAccounts_registerRewardAccountsCrons from "../tables/rewardAccounts/registerRewardAccountsCrons.js";
import type * as tables_rewardAccounts_schemas_rewardAccountsSchema from "../tables/rewardAccounts/schemas/rewardAccountsSchema.js";
import type * as tables_rewardClaims_mutations_applyRewardClaim from "../tables/rewardClaims/mutations/applyRewardClaim.js";
import type * as tables_rewardClaims_mutations_cancelRewardClaim from "../tables/rewardClaims/mutations/cancelRewardClaim.js";
import type * as tables_rewardClaims_mutations_claimReward from "../tables/rewardClaims/mutations/claimReward.js";
import type * as tables_rewardClaims_mutations_releaseRewardClaim from "../tables/rewardClaims/mutations/releaseRewardClaim.js";
import type * as tables_rewardClaims_schemas_rewardClaimsSchema from "../tables/rewardClaims/schemas/rewardClaimsSchema.js";
import type * as tables_rewardLedger_aggregates_rewardLedgerFilterAggregate from "../tables/rewardLedger/aggregates/rewardLedgerFilterAggregate.js";
import type * as tables_rewardLedger_counters_rewardLedgerTotalCounter from "../tables/rewardLedger/counters/rewardLedgerTotalCounter.js";
import type * as tables_rewardLedger_crons_rewardLedgerCrons from "../tables/rewardLedger/crons/rewardLedgerCrons.js";
import type * as tables_rewardLedger_helpers_grantStampCore from "../tables/rewardLedger/helpers/grantStampCore.js";
import type * as tables_rewardLedger_mutations_adjustReward from "../tables/rewardLedger/mutations/adjustReward.js";
import type * as tables_rewardLedger_mutations_grantStamp from "../tables/rewardLedger/mutations/grantStamp.js";
import type * as tables_rewardLedger_mutations_grantStampForOrder from "../tables/rewardLedger/mutations/grantStampForOrder.js";
import type * as tables_rewardLedger_mutations_revokeStampForOrder from "../tables/rewardLedger/mutations/revokeStampForOrder.js";
import type * as tables_rewardLedger_queries_fetchMyLedger from "../tables/rewardLedger/queries/fetchMyLedger.js";
import type * as tables_rewardLedger_queries_fetchUserLedger from "../tables/rewardLedger/queries/fetchUserLedger.js";
import type * as tables_rewardLedger_registerRewardLedgerCrons from "../tables/rewardLedger/registerRewardLedgerCrons.js";
import type * as tables_rewardLedger_schemas_rewardLedgerSchema from "../tables/rewardLedger/schemas/rewardLedgerSchema.js";
import type * as tables_rewardLedger_validators_rewardLedgerValidators from "../tables/rewardLedger/validators/rewardLedgerValidators.js";
import type * as tables_upsells_helpers_validateUpsellRule from "../tables/upsells/helpers/validateUpsellRule.js";
import type * as tables_upsells_mutations_createUpsellRule from "../tables/upsells/mutations/createUpsellRule.js";
import type * as tables_upsells_mutations_deleteUpsellRule from "../tables/upsells/mutations/deleteUpsellRule.js";
import type * as tables_upsells_mutations_editUpsellRule from "../tables/upsells/mutations/editUpsellRule.js";
import type * as tables_upsells_mutations_setUpsellRuleEnabled from "../tables/upsells/mutations/setUpsellRuleEnabled.js";
import type * as tables_upsells_queries_fetchUpsellCatalog from "../tables/upsells/queries/fetchUpsellCatalog.js";
import type * as tables_upsells_queries_fetchUpsellRules from "../tables/upsells/queries/fetchUpsellRules.js";
import type * as tables_upsells_schemas_upsellsSchema from "../tables/upsells/schemas/upsellsSchema.js";
import type * as tables_upsells_validators_upsellsValidators from "../tables/upsells/validators/upsellsValidators.js";
import type * as utils_buildFilterWhere from "../utils/buildFilterWhere.js";
import type * as utils_cursorPagination from "../utils/cursorPagination.js";
import type * as validators_mutationResult from "../validators/mutationResult.js";
import type * as wrappers_fetchOptimizedQuery from "../wrappers/fetchOptimizedQuery.js";
import type * as wrappers_fetchOptimizedSearchQuery from "../wrappers/fetchOptimizedSearchQuery.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "aggregates/helpers/createCounterAggregate": typeof aggregates_helpers_createCounterAggregate;
  "aggregates/helpers/getFilteredTotalAggregate": typeof aggregates_helpers_getFilteredTotalAggregate;
  "aggregates/helpers/getTotalSizeAggregate": typeof aggregates_helpers_getTotalSizeAggregate;
  "aggregates/triggersAggregate": typeof aggregates_triggersAggregate;
  "aggregates/types/aggregateTypes": typeof aggregates_types_aggregateTypes;
  "aggregates/utils/getPrefixRangeBoundsAggregate": typeof aggregates_utils_getPrefixRangeBoundsAggregate;
  auth: typeof auth;
  "builders/convexFunctionBuilders": typeof builders_convexFunctionBuilders;
  crons: typeof crons;
  "emails/data/emailData": typeof emails_data_emailData;
  "emails/helpers/getOrderForEmail": typeof emails_helpers_getOrderForEmail;
  "emails/helpers/getRewardEmailData": typeof emails_helpers_getRewardEmailData;
  "emails/sendEmail": typeof emails_sendEmail;
  "emails/sendViaResend": typeof emails_sendViaResend;
  "emails/templates/authOtpEmail": typeof emails_templates_authOtpEmail;
  "emails/templates/emailFooter": typeof emails_templates_emailFooter;
  "emails/templates/emailHeader": typeof emails_templates_emailHeader;
  "emails/templates/emailLayout": typeof emails_templates_emailLayout;
  "emails/templates/newOrderOwnerEmail": typeof emails_templates_newOrderOwnerEmail;
  "emails/templates/orderCancelledEmail": typeof emails_templates_orderCancelledEmail;
  "emails/templates/orderPaidEmail": typeof emails_templates_orderPaidEmail;
  "emails/templates/orderReceivedEmail": typeof emails_templates_orderReceivedEmail;
  "emails/templates/orderRefundedEmail": typeof emails_templates_orderRefundedEmail;
  "emails/templates/orderShippedEmail": typeof emails_templates_orderShippedEmail;
  "emails/templates/orderSummaryTable": typeof emails_templates_orderSummaryTable;
  "emails/templates/rewardExpiryWarningEmail": typeof emails_templates_rewardExpiryWarningEmail;
  "emails/templates/rewardUnlockedEmail": typeof emails_templates_rewardUnlockedEmail;
  "emails/types/emailTypes": typeof emails_types_emailTypes;
  functions: typeof functions;
  "helpers/getPagination": typeof helpers_getPagination;
  "helpers/paginateSearch": typeof helpers_paginateSearch;
  http: typeof http;
  "migrations/migrations": typeof migrations_migrations;
  "migrations/tables/backfillOrderAggregates": typeof migrations_tables_backfillOrderAggregates;
  "migrations/tables/backfillProductAggregates": typeof migrations_tables_backfillProductAggregates;
  "migrations/tables/backfillProductCategoryAggregates": typeof migrations_tables_backfillProductCategoryAggregates;
  "migrations/tables/backfillProductVariantAggregates": typeof migrations_tables_backfillProductVariantAggregates;
  "migrations/tables/backfillRewardLedgerAggregates": typeof migrations_tables_backfillRewardLedgerAggregates;
  "rateLimits/helpers/enforceRateLimit": typeof rateLimits_helpers_enforceRateLimit;
  "rateLimits/types/rateLimitTypes": typeof rateLimits_types_rateLimitTypes;
  "storage/r2": typeof storage_r2;
  "stripe/actions/expireStripeSession": typeof stripe_actions_expireStripeSession;
  "stripe/helpers/createCheckoutSession": typeof stripe_helpers_createCheckoutSession;
  "stripe/helpers/createOneTimeCoupon": typeof stripe_helpers_createOneTimeCoupon;
  "stripe/helpers/expireCheckoutSession": typeof stripe_helpers_expireCheckoutSession;
  "stripe/helpers/refundPayment": typeof stripe_helpers_refundPayment;
  "stripe/helpers/retrieveCheckoutSession": typeof stripe_helpers_retrieveCheckoutSession;
  "stripe/helpers/verifyStripeWebhookEvent": typeof stripe_helpers_verifyStripeWebhookEvent;
  "stripe/stripeClient": typeof stripe_stripeClient;
  "stripe/utils/isStripeAlreadyDoneError": typeof stripe_utils_isStripeAlreadyDoneError;
  "tables/cart/helpers/loadCart": typeof tables_cart_helpers_loadCart;
  "tables/cart/helpers/resolveRefs": typeof tables_cart_helpers_resolveRefs;
  "tables/cart/mutations/addLine": typeof tables_cart_mutations_addLine;
  "tables/cart/mutations/clearCart": typeof tables_cart_mutations_clearCart;
  "tables/cart/mutations/mergeGuestCart": typeof tables_cart_mutations_mergeGuestCart;
  "tables/cart/mutations/setLineQty": typeof tables_cart_mutations_setLineQty;
  "tables/cart/queries/getMyCart": typeof tables_cart_queries_getMyCart;
  "tables/cart/queries/resolveCartProducts": typeof tables_cart_queries_resolveCartProducts;
  "tables/cart/schemas/cartSchema": typeof tables_cart_schemas_cartSchema;
  "tables/cart/validators/cartValidators": typeof tables_cart_validators_cartValidators;
  "tables/firstPurchases/helpers/getWelcomeOfferEligibility": typeof tables_firstPurchases_helpers_getWelcomeOfferEligibility;
  "tables/firstPurchases/mutations/recordFirstPurchase": typeof tables_firstPurchases_mutations_recordFirstPurchase;
  "tables/firstPurchases/schemas/firstPurchasesSchema": typeof tables_firstPurchases_schemas_firstPurchasesSchema;
  "tables/orders/actions/createCheckoutSession": typeof tables_orders_actions_createCheckoutSession;
  "tables/orders/actions/handleStripeEvent": typeof tables_orders_actions_handleStripeEvent;
  "tables/orders/actions/refundOrphanPayment": typeof tables_orders_actions_refundOrphanPayment;
  "tables/orders/actions/refundStripePayment": typeof tables_orders_actions_refundStripePayment;
  "tables/orders/aggregates/orderFilterAggregate": typeof tables_orders_aggregates_orderFilterAggregate;
  "tables/orders/aggregates/userOrderFilterAggregate": typeof tables_orders_aggregates_userOrderFilterAggregate;
  "tables/orders/counters/orderTotalCounter": typeof tables_orders_counters_orderTotalCounter;
  "tables/orders/counters/userOrderTotalCounter": typeof tables_orders_counters_userOrderTotalCounter;
  "tables/orders/crons/ordersCrons": typeof tables_orders_crons_ordersCrons;
  "tables/orders/helpers/buildOrderSearchText": typeof tables_orders_helpers_buildOrderSearchText;
  "tables/orders/helpers/calculateOrderPrice": typeof tables_orders_helpers_calculateOrderPrice;
  "tables/orders/helpers/getOrderForPayment": typeof tables_orders_helpers_getOrderForPayment;
  "tables/orders/helpers/isSameDraftInput": typeof tables_orders_helpers_isSameDraftInput;
  "tables/orders/helpers/orderDetail": typeof tables_orders_helpers_orderDetail;
  "tables/orders/helpers/orderUrls": typeof tables_orders_helpers_orderUrls;
  "tables/orders/http/stripeWebhook": typeof tables_orders_http_stripeWebhook;
  "tables/orders/mutations/cancelMyOrder": typeof tables_orders_mutations_cancelMyOrder;
  "tables/orders/mutations/markOrderPaid": typeof tables_orders_mutations_markOrderPaid;
  "tables/orders/mutations/markOrderRefunded": typeof tables_orders_mutations_markOrderRefunded;
  "tables/orders/mutations/placeOrder": typeof tables_orders_mutations_placeOrder;
  "tables/orders/mutations/refundOrder": typeof tables_orders_mutations_refundOrder;
  "tables/orders/mutations/setFulfillment": typeof tables_orders_mutations_setFulfillment;
  "tables/orders/mutations/setOrderFulfillment": typeof tables_orders_mutations_setOrderFulfillment;
  "tables/orders/mutations/setPaymentSession": typeof tables_orders_mutations_setPaymentSession;
  "tables/orders/mutations/settleOrder": typeof tables_orders_mutations_settleOrder;
  "tables/orders/providers/manual": typeof tables_orders_providers_manual;
  "tables/orders/providers/registry": typeof tables_orders_providers_registry;
  "tables/orders/providers/stripe": typeof tables_orders_providers_stripe;
  "tables/orders/providers/types": typeof tables_orders_providers_types;
  "tables/orders/queries/fetchDashboard": typeof tables_orders_queries_fetchDashboard;
  "tables/orders/queries/fetchMyLatestOrders": typeof tables_orders_queries_fetchMyLatestOrders;
  "tables/orders/queries/fetchMyOrders": typeof tables_orders_queries_fetchMyOrders;
  "tables/orders/queries/fetchOrder": typeof tables_orders_queries_fetchOrder;
  "tables/orders/queries/fetchOrderByNumber": typeof tables_orders_queries_fetchOrderByNumber;
  "tables/orders/queries/fetchOrderForAdmin": typeof tables_orders_queries_fetchOrderForAdmin;
  "tables/orders/queries/fetchOrders": typeof tables_orders_queries_fetchOrders;
  "tables/orders/queries/fetchOrdersCounts": typeof tables_orders_queries_fetchOrdersCounts;
  "tables/orders/registerOrdersCrons": typeof tables_orders_registerOrdersCrons;
  "tables/orders/schemas/ordersSchema": typeof tables_orders_schemas_ordersSchema;
  "tables/orders/validators/ordersValidators": typeof tables_orders_validators_ordersValidators;
  "tables/productCategories/aggregates/productCategoryFilterAggregate": typeof tables_productCategories_aggregates_productCategoryFilterAggregate;
  "tables/productCategories/counters/productCategoryTotalCounter": typeof tables_productCategories_counters_productCategoryTotalCounter;
  "tables/productCategories/mutations/createCategory": typeof tables_productCategories_mutations_createCategory;
  "tables/productCategories/mutations/deleteCategory": typeof tables_productCategories_mutations_deleteCategory;
  "tables/productCategories/mutations/editCategory": typeof tables_productCategories_mutations_editCategory;
  "tables/productCategories/queries/fetchAllCategories": typeof tables_productCategories_queries_fetchAllCategories;
  "tables/productCategories/queries/fetchCategoriesSafe": typeof tables_productCategories_queries_fetchCategoriesSafe;
  "tables/productCategories/queries/fetchCategoryById": typeof tables_productCategories_queries_fetchCategoryById;
  "tables/productCategories/queries/fetchCategoryOptions": typeof tables_productCategories_queries_fetchCategoryOptions;
  "tables/productCategories/queries/fetchCategoryPage": typeof tables_productCategories_queries_fetchCategoryPage;
  "tables/productCategories/schemas/productCategoriesSchema": typeof tables_productCategories_schemas_productCategoriesSchema;
  "tables/productCategories/validators/productCategoriesValidators": typeof tables_productCategories_validators_productCategoriesValidators;
  "tables/productVariants/aggregates/productVariantFilterAggregate": typeof tables_productVariants_aggregates_productVariantFilterAggregate;
  "tables/productVariants/counters/rewardEligibleVariantTotalCounter": typeof tables_productVariants_counters_rewardEligibleVariantTotalCounter;
  "tables/productVariants/mutations/setVariantRewardEligible": typeof tables_productVariants_mutations_setVariantRewardEligible;
  "tables/productVariants/queries/fetchProductVariantsForSearch": typeof tables_productVariants_queries_fetchProductVariantsForSearch;
  "tables/productVariants/queries/fetchRewardItems": typeof tables_productVariants_queries_fetchRewardItems;
  "tables/productVariants/queries/fetchRewardProducts": typeof tables_productVariants_queries_fetchRewardProducts;
  "tables/productVariants/schemas/productVariantsSchema": typeof tables_productVariants_schemas_productVariantsSchema;
  "tables/productVariants/validators/productVariantsValidators": typeof tables_productVariants_validators_productVariantsValidators;
  "tables/products/aggregates/productFilterAggregate": typeof tables_products_aggregates_productFilterAggregate;
  "tables/products/counters/productTotalCounter": typeof tables_products_counters_productTotalCounter;
  "tables/products/helpers/attachVariants": typeof tables_products_helpers_attachVariants;
  "tables/products/helpers/getProductSlug": typeof tables_products_helpers_getProductSlug;
  "tables/products/helpers/getProductsPage": typeof tables_products_helpers_getProductsPage;
  "tables/products/helpers/resolveImageUrls": typeof tables_products_helpers_resolveImageUrls;
  "tables/products/mutations/createProduct": typeof tables_products_mutations_createProduct;
  "tables/products/mutations/deleteProduct": typeof tables_products_mutations_deleteProduct;
  "tables/products/mutations/editProduct": typeof tables_products_mutations_editProduct;
  "tables/products/mutations/setProductStatus": typeof tables_products_mutations_setProductStatus;
  "tables/products/queries/fetchAllProducts": typeof tables_products_queries_fetchAllProducts;
  "tables/products/queries/fetchProductById": typeof tables_products_queries_fetchProductById;
  "tables/products/queries/fetchProductsForSearch": typeof tables_products_queries_fetchProductsForSearch;
  "tables/products/schemas/productsSchema": typeof tables_products_schemas_productsSchema;
  "tables/products/validators/productsValidators": typeof tables_products_validators_productsValidators;
  "tables/rewardAccounts/crons/rewardAccountsCrons": typeof tables_rewardAccounts_crons_rewardAccountsCrons;
  "tables/rewardAccounts/helpers/applyConfirmedStamp": typeof tables_rewardAccounts_helpers_applyConfirmedStamp;
  "tables/rewardAccounts/helpers/getRewardsSnapshot": typeof tables_rewardAccounts_helpers_getRewardsSnapshot;
  "tables/rewardAccounts/helpers/loadOrCreateAccount": typeof tables_rewardAccounts_helpers_loadOrCreateAccount;
  "tables/rewardAccounts/registerRewardAccountsCrons": typeof tables_rewardAccounts_registerRewardAccountsCrons;
  "tables/rewardAccounts/schemas/rewardAccountsSchema": typeof tables_rewardAccounts_schemas_rewardAccountsSchema;
  "tables/rewardClaims/mutations/applyRewardClaim": typeof tables_rewardClaims_mutations_applyRewardClaim;
  "tables/rewardClaims/mutations/cancelRewardClaim": typeof tables_rewardClaims_mutations_cancelRewardClaim;
  "tables/rewardClaims/mutations/claimReward": typeof tables_rewardClaims_mutations_claimReward;
  "tables/rewardClaims/mutations/releaseRewardClaim": typeof tables_rewardClaims_mutations_releaseRewardClaim;
  "tables/rewardClaims/schemas/rewardClaimsSchema": typeof tables_rewardClaims_schemas_rewardClaimsSchema;
  "tables/rewardLedger/aggregates/rewardLedgerFilterAggregate": typeof tables_rewardLedger_aggregates_rewardLedgerFilterAggregate;
  "tables/rewardLedger/counters/rewardLedgerTotalCounter": typeof tables_rewardLedger_counters_rewardLedgerTotalCounter;
  "tables/rewardLedger/crons/rewardLedgerCrons": typeof tables_rewardLedger_crons_rewardLedgerCrons;
  "tables/rewardLedger/helpers/grantStampCore": typeof tables_rewardLedger_helpers_grantStampCore;
  "tables/rewardLedger/mutations/adjustReward": typeof tables_rewardLedger_mutations_adjustReward;
  "tables/rewardLedger/mutations/grantStamp": typeof tables_rewardLedger_mutations_grantStamp;
  "tables/rewardLedger/mutations/grantStampForOrder": typeof tables_rewardLedger_mutations_grantStampForOrder;
  "tables/rewardLedger/mutations/revokeStampForOrder": typeof tables_rewardLedger_mutations_revokeStampForOrder;
  "tables/rewardLedger/queries/fetchMyLedger": typeof tables_rewardLedger_queries_fetchMyLedger;
  "tables/rewardLedger/queries/fetchUserLedger": typeof tables_rewardLedger_queries_fetchUserLedger;
  "tables/rewardLedger/registerRewardLedgerCrons": typeof tables_rewardLedger_registerRewardLedgerCrons;
  "tables/rewardLedger/schemas/rewardLedgerSchema": typeof tables_rewardLedger_schemas_rewardLedgerSchema;
  "tables/rewardLedger/validators/rewardLedgerValidators": typeof tables_rewardLedger_validators_rewardLedgerValidators;
  "tables/upsells/helpers/validateUpsellRule": typeof tables_upsells_helpers_validateUpsellRule;
  "tables/upsells/mutations/createUpsellRule": typeof tables_upsells_mutations_createUpsellRule;
  "tables/upsells/mutations/deleteUpsellRule": typeof tables_upsells_mutations_deleteUpsellRule;
  "tables/upsells/mutations/editUpsellRule": typeof tables_upsells_mutations_editUpsellRule;
  "tables/upsells/mutations/setUpsellRuleEnabled": typeof tables_upsells_mutations_setUpsellRuleEnabled;
  "tables/upsells/queries/fetchUpsellCatalog": typeof tables_upsells_queries_fetchUpsellCatalog;
  "tables/upsells/queries/fetchUpsellRules": typeof tables_upsells_queries_fetchUpsellRules;
  "tables/upsells/schemas/upsellsSchema": typeof tables_upsells_schemas_upsellsSchema;
  "tables/upsells/validators/upsellsValidators": typeof tables_upsells_validators_upsellsValidators;
  "utils/buildFilterWhere": typeof utils_buildFilterWhere;
  "utils/cursorPagination": typeof utils_cursorPagination;
  "validators/mutationResult": typeof validators_mutationResult;
  "wrappers/fetchOptimizedQuery": typeof wrappers_fetchOptimizedQuery;
  "wrappers/fetchOptimizedSearchQuery": typeof wrappers_fetchOptimizedSearchQuery;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  rateLimiter: import("@convex-dev/rate-limiter/_generated/component.js").ComponentApi<"rateLimiter">;
  betterAuth: import("../betterAuth/_generated/component.js").ComponentApi<"betterAuth">;
  migrations: import("@convex-dev/migrations/_generated/component.js").ComponentApi<"migrations">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  analytics: import("@vllnt/convex-analytics/_generated/component.js").ComponentApi<"analytics">;
  productsTotalCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"productsTotalCounter">;
  productCategoriesTotalCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"productCategoriesTotalCounter">;
  rewardEligibleVariantsTotalCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"rewardEligibleVariantsTotalCounter">;
  ordersTotalCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"ordersTotalCounter">;
  userOrdersTotalCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"userOrdersTotalCounter">;
  rewardLedgerTotalCounter: import("@convex-dev/sharded-counter/_generated/component.js").ComponentApi<"rewardLedgerTotalCounter">;
  productsFilterAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"productsFilterAggregate">;
  productCategoriesFilterAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"productCategoriesFilterAggregate">;
  productVariantsFilterAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"productVariantsFilterAggregate">;
  ordersFilterAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"ordersFilterAggregate">;
  userOrdersFilterAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"userOrdersFilterAggregate">;
  rewardLedgerFilterAggregate: import("@convex-dev/aggregate/_generated/component.js").ComponentApi<"rewardLedgerFilterAggregate">;
};
