/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics_analytics from "../analytics/analytics.js";
import type * as analytics_index from "../analytics/index.js";
import type * as analytics_queries_analyticsQueries from "../analytics/queries/analyticsQueries.js";
import type * as auth_auth from "../auth/auth.js";
import type * as auth_authRoutes from "../auth/authRoutes.js";
import type * as auth_convexCreateAuthRateLimitHook from "../auth/convexCreateAuthRateLimitHook.js";
import type * as auth_emails_sendVerificationOTP from "../auth/emails/sendVerificationOTP.js";
import type * as auth_helpers_getAuthUserId from "../auth/helpers/getAuthUserId.js";
import type * as auth_middleware_authMiddleware from "../auth/middleware/authMiddleware.js";
import type * as auth_queries_authQueries from "../auth/queries/authQueries.js";
import type * as auth_utils_getEmailFromAuthBody from "../auth/utils/getEmailFromAuthBody.js";
import type * as convexRateLimiter from "../convexRateLimiter.js";
import type * as crons from "../crons.js";
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
import type * as helpers_convexGetRateLimitedUserId from "../helpers/convexGetRateLimitedUserId.js";
import type * as helpers_createDeleteMutation from "../helpers/createDeleteMutation.js";
import type * as helpers_fetchOptimized_createSearchQuery from "../helpers/fetchOptimized/createSearchQuery.js";
import type * as helpers_fetchOptimized_fetchOptimized from "../helpers/fetchOptimized/fetchOptimized.js";
import type * as helpers_fetchOptimized_index from "../helpers/fetchOptimized/index.js";
import type * as helpers_fetchOptimized_kit from "../helpers/fetchOptimized/kit.js";
import type * as helpers_fetchOptimized_types from "../helpers/fetchOptimized/types.js";
import type * as helpers_mutationResult from "../helpers/mutationResult.js";
import type * as helpers_paginationHelpers from "../helpers/paginationHelpers.js";
import type * as helpers_resolveUploadedImages from "../helpers/resolveUploadedImages.js";
import type * as http from "../http.js";
import type * as rateLimits_convexCreateRateLimit from "../rateLimits/convexCreateRateLimit.js";
import type * as rateLimits_convexCreateRateLimitInternal from "../rateLimits/convexCreateRateLimitInternal.js";
import type * as rateLimits_registry from "../rateLimits/registry.js";
import type * as rateLimits_searchRateLimitMutations from "../rateLimits/searchRateLimitMutations.js";
import type * as storage_crons_cleanupOrphanDataR2 from "../storage/crons/cleanupOrphanDataR2.js";
import type * as storage_r2_buildR2PublicObjectUrl from "../storage/r2/buildR2PublicObjectUrl.js";
import type * as storage_r2_r2 from "../storage/r2/r2.js";
import type * as storage_r2_resolveImageUrl from "../storage/r2/resolveImageUrl.js";
import type * as storage_r2_uploadedFilesR2 from "../storage/r2/uploadedFilesR2.js";
import type * as storage_registerStorageCrons from "../storage/registerStorageCrons.js";
import type * as tables_auditLog_auditLogConfigs from "../tables/auditLog/auditLogConfigs.js";
import type * as tables_auditLog_crons_auditLogCron from "../tables/auditLog/crons/auditLogCron.js";
import type * as tables_auditLog_helpers_auditLogInternal from "../tables/auditLog/helpers/auditLogInternal.js";
import type * as tables_auditLog_helpers_logAudit from "../tables/auditLog/helpers/logAudit.js";
import type * as tables_auditLog_index from "../tables/auditLog/index.js";
import type * as tables_auditLog_queries_auditLogQueries from "../tables/auditLog/queries/auditLogQueries.js";
import type * as tables_auditLog_registerAuditLogCrons from "../tables/auditLog/registerAuditLogCrons.js";
import type * as tables_auditLog_schemas_auditLogSchema from "../tables/auditLog/schemas/auditLogSchema.js";
import type * as tables_auditLog_utils_auditLogUtils from "../tables/auditLog/utils/auditLogUtils.js";
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
import type * as tables_orders_crons_ordersCrons from "../tables/orders/crons/ordersCrons.js";
import type * as tables_orders_helpers_buildOrderSearchText from "../tables/orders/helpers/buildOrderSearchText.js";
import type * as tables_orders_helpers_calculateOrderPrice from "../tables/orders/helpers/calculateOrderPrice.js";
import type * as tables_orders_mutations_cancelMyOrder from "../tables/orders/mutations/cancelMyOrder.js";
import type * as tables_orders_mutations_markOrderPaid from "../tables/orders/mutations/markOrderPaid.js";
import type * as tables_orders_mutations_markOrderRefunded from "../tables/orders/mutations/markOrderRefunded.js";
import type * as tables_orders_mutations_placeOrder from "../tables/orders/mutations/placeOrder.js";
import type * as tables_orders_mutations_refundOrder from "../tables/orders/mutations/refundOrder.js";
import type * as tables_orders_mutations_setFulfillment from "../tables/orders/mutations/setFulfillment.js";
import type * as tables_orders_mutations_setOrderFulfillment from "../tables/orders/mutations/setOrderFulfillment.js";
import type * as tables_orders_mutations_settleOrder from "../tables/orders/mutations/settleOrder.js";
import type * as tables_orders_providers_manual from "../tables/orders/providers/manual.js";
import type * as tables_orders_providers_registry from "../tables/orders/providers/registry.js";
import type * as tables_orders_providers_types from "../tables/orders/providers/types.js";
import type * as tables_orders_queries_fetchMyLatestOrders from "../tables/orders/queries/fetchMyLatestOrders.js";
import type * as tables_orders_queries_fetchMyOrders from "../tables/orders/queries/fetchMyOrders.js";
import type * as tables_orders_queries_fetchOrder from "../tables/orders/queries/fetchOrder.js";
import type * as tables_orders_queries_fetchOrderForAdmin from "../tables/orders/queries/fetchOrderForAdmin.js";
import type * as tables_orders_queries_fetchOrders from "../tables/orders/queries/fetchOrders.js";
import type * as tables_orders_registerOrdersCrons from "../tables/orders/registerOrdersCrons.js";
import type * as tables_orders_schemas_ordersSchema from "../tables/orders/schemas/ordersSchema.js";
import type * as tables_orders_validators_ordersValidators from "../tables/orders/validators/ordersValidators.js";
import type * as tables_productCategories_mutations_createCategory from "../tables/productCategories/mutations/createCategory.js";
import type * as tables_productCategories_mutations_deleteCategory from "../tables/productCategories/mutations/deleteCategory.js";
import type * as tables_productCategories_mutations_editCategory from "../tables/productCategories/mutations/editCategory.js";
import type * as tables_productCategories_queries_fetchAllCategories from "../tables/productCategories/queries/fetchAllCategories.js";
import type * as tables_productCategories_queries_fetchCategoriesSafe from "../tables/productCategories/queries/fetchCategoriesSafe.js";
import type * as tables_productCategories_queries_fetchCategoryById from "../tables/productCategories/queries/fetchCategoryById.js";
import type * as tables_productCategories_queries_fetchCategoryBySlug from "../tables/productCategories/queries/fetchCategoryBySlug.js";
import type * as tables_productCategories_schemas_productCategoriesSchema from "../tables/productCategories/schemas/productCategoriesSchema.js";
import type * as tables_productCategories_validators_productCategoriesValidators from "../tables/productCategories/validators/productCategoriesValidators.js";
import type * as tables_productVariants_mutations_setVariantRewardEligible from "../tables/productVariants/mutations/setVariantRewardEligible.js";
import type * as tables_productVariants_queries_fetchRewardItems from "../tables/productVariants/queries/fetchRewardItems.js";
import type * as tables_productVariants_schemas_productVariantsSchema from "../tables/productVariants/schemas/productVariantsSchema.js";
import type * as tables_productVariants_validators_productVariantsValidators from "../tables/productVariants/validators/productVariantsValidators.js";
import type * as tables_products_helpers_attachVariants from "../tables/products/helpers/attachVariants.js";
import type * as tables_products_helpers_getProductSlug from "../tables/products/helpers/getProductSlug.js";
import type * as tables_products_helpers_resolveImageUrls from "../tables/products/helpers/resolveImageUrls.js";
import type * as tables_products_mutations_createProduct from "../tables/products/mutations/createProduct.js";
import type * as tables_products_mutations_deleteProduct from "../tables/products/mutations/deleteProduct.js";
import type * as tables_products_mutations_editProduct from "../tables/products/mutations/editProduct.js";
import type * as tables_products_mutations_setProductStatus from "../tables/products/mutations/setProductStatus.js";
import type * as tables_products_queries_fetchAllProducts from "../tables/products/queries/fetchAllProducts.js";
import type * as tables_products_queries_fetchProductById from "../tables/products/queries/fetchProductById.js";
import type * as tables_products_queries_fetchProductsByCategory from "../tables/products/queries/fetchProductsByCategory.js";
import type * as tables_products_queries_fetchRewardCatalog from "../tables/products/queries/fetchRewardCatalog.js";
import type * as tables_products_schemas_productsSchema from "../tables/products/schemas/productsSchema.js";
import type * as tables_products_validators_productsValidators from "../tables/products/validators/productsValidators.js";
import type * as tables_rewardAccounts_crons_rewardAccountsCrons from "../tables/rewardAccounts/crons/rewardAccountsCrons.js";
import type * as tables_rewardAccounts_helpers_applyConfirmedStamp from "../tables/rewardAccounts/helpers/applyConfirmedStamp.js";
import type * as tables_rewardAccounts_helpers_getRewardsSnapshot from "../tables/rewardAccounts/helpers/getRewardsSnapshot.js";
import type * as tables_rewardAccounts_helpers_loadOrCreateAccount from "../tables/rewardAccounts/helpers/loadOrCreateAccount.js";
import type * as tables_rewardAccounts_mutations_adminRebuildRewardAccount from "../tables/rewardAccounts/mutations/adminRebuildRewardAccount.js";
import type * as tables_rewardAccounts_mutations_rebuildRewardAccount from "../tables/rewardAccounts/mutations/rebuildRewardAccount.js";
import type * as tables_rewardAccounts_queries_fetchRewardAccount from "../tables/rewardAccounts/queries/fetchRewardAccount.js";
import type * as tables_rewardAccounts_registerRewardAccountsCrons from "../tables/rewardAccounts/registerRewardAccountsCrons.js";
import type * as tables_rewardAccounts_schemas_rewardAccountsSchema from "../tables/rewardAccounts/schemas/rewardAccountsSchema.js";
import type * as tables_rewardClaims_mutations_applyRewardClaim from "../tables/rewardClaims/mutations/applyRewardClaim.js";
import type * as tables_rewardClaims_mutations_cancelRewardClaim from "../tables/rewardClaims/mutations/cancelRewardClaim.js";
import type * as tables_rewardClaims_mutations_claimReward from "../tables/rewardClaims/mutations/claimReward.js";
import type * as tables_rewardClaims_mutations_releaseRewardClaim from "../tables/rewardClaims/mutations/releaseRewardClaim.js";
import type * as tables_rewardClaims_schemas_rewardClaimsSchema from "../tables/rewardClaims/schemas/rewardClaimsSchema.js";
import type * as tables_rewardLedger_crons_rewardLedgerCrons from "../tables/rewardLedger/crons/rewardLedgerCrons.js";
import type * as tables_rewardLedger_helpers_grantStampCore from "../tables/rewardLedger/helpers/grantStampCore.js";
import type * as tables_rewardLedger_mutations_adjustReward from "../tables/rewardLedger/mutations/adjustReward.js";
import type * as tables_rewardLedger_mutations_adminAdjustReward from "../tables/rewardLedger/mutations/adminAdjustReward.js";
import type * as tables_rewardLedger_mutations_grantStamp from "../tables/rewardLedger/mutations/grantStamp.js";
import type * as tables_rewardLedger_mutations_grantStampForOrder from "../tables/rewardLedger/mutations/grantStampForOrder.js";
import type * as tables_rewardLedger_mutations_revokeStampForOrder from "../tables/rewardLedger/mutations/revokeStampForOrder.js";
import type * as tables_rewardLedger_queries_fetchMyLedger from "../tables/rewardLedger/queries/fetchMyLedger.js";
import type * as tables_rewardLedger_queries_fetchUserLedger from "../tables/rewardLedger/queries/fetchUserLedger.js";
import type * as tables_rewardLedger_registerRewardLedgerCrons from "../tables/rewardLedger/registerRewardLedgerCrons.js";
import type * as tables_rewardLedger_schemas_rewardLedgerSchema from "../tables/rewardLedger/schemas/rewardLedgerSchema.js";
import type * as tables_users_userMutations from "../tables/users/userMutations.js";
import type * as tables_users_userQueries from "../tables/users/userQueries.js";
import type * as types_convexTypes from "../types/convexTypes.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  "analytics/analytics": typeof analytics_analytics;
  "analytics/index": typeof analytics_index;
  "analytics/queries/analyticsQueries": typeof analytics_queries_analyticsQueries;
  "auth/auth": typeof auth_auth;
  "auth/authRoutes": typeof auth_authRoutes;
  "auth/convexCreateAuthRateLimitHook": typeof auth_convexCreateAuthRateLimitHook;
  "auth/emails/sendVerificationOTP": typeof auth_emails_sendVerificationOTP;
  "auth/helpers/getAuthUserId": typeof auth_helpers_getAuthUserId;
  "auth/middleware/authMiddleware": typeof auth_middleware_authMiddleware;
  "auth/queries/authQueries": typeof auth_queries_authQueries;
  "auth/utils/getEmailFromAuthBody": typeof auth_utils_getEmailFromAuthBody;
  convexRateLimiter: typeof convexRateLimiter;
  crons: typeof crons;
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
  "helpers/convexGetRateLimitedUserId": typeof helpers_convexGetRateLimitedUserId;
  "helpers/createDeleteMutation": typeof helpers_createDeleteMutation;
  "helpers/fetchOptimized/createSearchQuery": typeof helpers_fetchOptimized_createSearchQuery;
  "helpers/fetchOptimized/fetchOptimized": typeof helpers_fetchOptimized_fetchOptimized;
  "helpers/fetchOptimized/index": typeof helpers_fetchOptimized_index;
  "helpers/fetchOptimized/kit": typeof helpers_fetchOptimized_kit;
  "helpers/fetchOptimized/types": typeof helpers_fetchOptimized_types;
  "helpers/mutationResult": typeof helpers_mutationResult;
  "helpers/paginationHelpers": typeof helpers_paginationHelpers;
  "helpers/resolveUploadedImages": typeof helpers_resolveUploadedImages;
  http: typeof http;
  "rateLimits/convexCreateRateLimit": typeof rateLimits_convexCreateRateLimit;
  "rateLimits/convexCreateRateLimitInternal": typeof rateLimits_convexCreateRateLimitInternal;
  "rateLimits/registry": typeof rateLimits_registry;
  "rateLimits/searchRateLimitMutations": typeof rateLimits_searchRateLimitMutations;
  "storage/crons/cleanupOrphanDataR2": typeof storage_crons_cleanupOrphanDataR2;
  "storage/r2/buildR2PublicObjectUrl": typeof storage_r2_buildR2PublicObjectUrl;
  "storage/r2/r2": typeof storage_r2_r2;
  "storage/r2/resolveImageUrl": typeof storage_r2_resolveImageUrl;
  "storage/r2/uploadedFilesR2": typeof storage_r2_uploadedFilesR2;
  "storage/registerStorageCrons": typeof storage_registerStorageCrons;
  "tables/auditLog/auditLogConfigs": typeof tables_auditLog_auditLogConfigs;
  "tables/auditLog/crons/auditLogCron": typeof tables_auditLog_crons_auditLogCron;
  "tables/auditLog/helpers/auditLogInternal": typeof tables_auditLog_helpers_auditLogInternal;
  "tables/auditLog/helpers/logAudit": typeof tables_auditLog_helpers_logAudit;
  "tables/auditLog/index": typeof tables_auditLog_index;
  "tables/auditLog/queries/auditLogQueries": typeof tables_auditLog_queries_auditLogQueries;
  "tables/auditLog/registerAuditLogCrons": typeof tables_auditLog_registerAuditLogCrons;
  "tables/auditLog/schemas/auditLogSchema": typeof tables_auditLog_schemas_auditLogSchema;
  "tables/auditLog/utils/auditLogUtils": typeof tables_auditLog_utils_auditLogUtils;
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
  "tables/orders/crons/ordersCrons": typeof tables_orders_crons_ordersCrons;
  "tables/orders/helpers/buildOrderSearchText": typeof tables_orders_helpers_buildOrderSearchText;
  "tables/orders/helpers/calculateOrderPrice": typeof tables_orders_helpers_calculateOrderPrice;
  "tables/orders/mutations/cancelMyOrder": typeof tables_orders_mutations_cancelMyOrder;
  "tables/orders/mutations/markOrderPaid": typeof tables_orders_mutations_markOrderPaid;
  "tables/orders/mutations/markOrderRefunded": typeof tables_orders_mutations_markOrderRefunded;
  "tables/orders/mutations/placeOrder": typeof tables_orders_mutations_placeOrder;
  "tables/orders/mutations/refundOrder": typeof tables_orders_mutations_refundOrder;
  "tables/orders/mutations/setFulfillment": typeof tables_orders_mutations_setFulfillment;
  "tables/orders/mutations/setOrderFulfillment": typeof tables_orders_mutations_setOrderFulfillment;
  "tables/orders/mutations/settleOrder": typeof tables_orders_mutations_settleOrder;
  "tables/orders/providers/manual": typeof tables_orders_providers_manual;
  "tables/orders/providers/registry": typeof tables_orders_providers_registry;
  "tables/orders/providers/types": typeof tables_orders_providers_types;
  "tables/orders/queries/fetchMyLatestOrders": typeof tables_orders_queries_fetchMyLatestOrders;
  "tables/orders/queries/fetchMyOrders": typeof tables_orders_queries_fetchMyOrders;
  "tables/orders/queries/fetchOrder": typeof tables_orders_queries_fetchOrder;
  "tables/orders/queries/fetchOrderForAdmin": typeof tables_orders_queries_fetchOrderForAdmin;
  "tables/orders/queries/fetchOrders": typeof tables_orders_queries_fetchOrders;
  "tables/orders/registerOrdersCrons": typeof tables_orders_registerOrdersCrons;
  "tables/orders/schemas/ordersSchema": typeof tables_orders_schemas_ordersSchema;
  "tables/orders/validators/ordersValidators": typeof tables_orders_validators_ordersValidators;
  "tables/productCategories/mutations/createCategory": typeof tables_productCategories_mutations_createCategory;
  "tables/productCategories/mutations/deleteCategory": typeof tables_productCategories_mutations_deleteCategory;
  "tables/productCategories/mutations/editCategory": typeof tables_productCategories_mutations_editCategory;
  "tables/productCategories/queries/fetchAllCategories": typeof tables_productCategories_queries_fetchAllCategories;
  "tables/productCategories/queries/fetchCategoriesSafe": typeof tables_productCategories_queries_fetchCategoriesSafe;
  "tables/productCategories/queries/fetchCategoryById": typeof tables_productCategories_queries_fetchCategoryById;
  "tables/productCategories/queries/fetchCategoryBySlug": typeof tables_productCategories_queries_fetchCategoryBySlug;
  "tables/productCategories/schemas/productCategoriesSchema": typeof tables_productCategories_schemas_productCategoriesSchema;
  "tables/productCategories/validators/productCategoriesValidators": typeof tables_productCategories_validators_productCategoriesValidators;
  "tables/productVariants/mutations/setVariantRewardEligible": typeof tables_productVariants_mutations_setVariantRewardEligible;
  "tables/productVariants/queries/fetchRewardItems": typeof tables_productVariants_queries_fetchRewardItems;
  "tables/productVariants/schemas/productVariantsSchema": typeof tables_productVariants_schemas_productVariantsSchema;
  "tables/productVariants/validators/productVariantsValidators": typeof tables_productVariants_validators_productVariantsValidators;
  "tables/products/helpers/attachVariants": typeof tables_products_helpers_attachVariants;
  "tables/products/helpers/getProductSlug": typeof tables_products_helpers_getProductSlug;
  "tables/products/helpers/resolveImageUrls": typeof tables_products_helpers_resolveImageUrls;
  "tables/products/mutations/createProduct": typeof tables_products_mutations_createProduct;
  "tables/products/mutations/deleteProduct": typeof tables_products_mutations_deleteProduct;
  "tables/products/mutations/editProduct": typeof tables_products_mutations_editProduct;
  "tables/products/mutations/setProductStatus": typeof tables_products_mutations_setProductStatus;
  "tables/products/queries/fetchAllProducts": typeof tables_products_queries_fetchAllProducts;
  "tables/products/queries/fetchProductById": typeof tables_products_queries_fetchProductById;
  "tables/products/queries/fetchProductsByCategory": typeof tables_products_queries_fetchProductsByCategory;
  "tables/products/queries/fetchRewardCatalog": typeof tables_products_queries_fetchRewardCatalog;
  "tables/products/schemas/productsSchema": typeof tables_products_schemas_productsSchema;
  "tables/products/validators/productsValidators": typeof tables_products_validators_productsValidators;
  "tables/rewardAccounts/crons/rewardAccountsCrons": typeof tables_rewardAccounts_crons_rewardAccountsCrons;
  "tables/rewardAccounts/helpers/applyConfirmedStamp": typeof tables_rewardAccounts_helpers_applyConfirmedStamp;
  "tables/rewardAccounts/helpers/getRewardsSnapshot": typeof tables_rewardAccounts_helpers_getRewardsSnapshot;
  "tables/rewardAccounts/helpers/loadOrCreateAccount": typeof tables_rewardAccounts_helpers_loadOrCreateAccount;
  "tables/rewardAccounts/mutations/adminRebuildRewardAccount": typeof tables_rewardAccounts_mutations_adminRebuildRewardAccount;
  "tables/rewardAccounts/mutations/rebuildRewardAccount": typeof tables_rewardAccounts_mutations_rebuildRewardAccount;
  "tables/rewardAccounts/queries/fetchRewardAccount": typeof tables_rewardAccounts_queries_fetchRewardAccount;
  "tables/rewardAccounts/registerRewardAccountsCrons": typeof tables_rewardAccounts_registerRewardAccountsCrons;
  "tables/rewardAccounts/schemas/rewardAccountsSchema": typeof tables_rewardAccounts_schemas_rewardAccountsSchema;
  "tables/rewardClaims/mutations/applyRewardClaim": typeof tables_rewardClaims_mutations_applyRewardClaim;
  "tables/rewardClaims/mutations/cancelRewardClaim": typeof tables_rewardClaims_mutations_cancelRewardClaim;
  "tables/rewardClaims/mutations/claimReward": typeof tables_rewardClaims_mutations_claimReward;
  "tables/rewardClaims/mutations/releaseRewardClaim": typeof tables_rewardClaims_mutations_releaseRewardClaim;
  "tables/rewardClaims/schemas/rewardClaimsSchema": typeof tables_rewardClaims_schemas_rewardClaimsSchema;
  "tables/rewardLedger/crons/rewardLedgerCrons": typeof tables_rewardLedger_crons_rewardLedgerCrons;
  "tables/rewardLedger/helpers/grantStampCore": typeof tables_rewardLedger_helpers_grantStampCore;
  "tables/rewardLedger/mutations/adjustReward": typeof tables_rewardLedger_mutations_adjustReward;
  "tables/rewardLedger/mutations/adminAdjustReward": typeof tables_rewardLedger_mutations_adminAdjustReward;
  "tables/rewardLedger/mutations/grantStamp": typeof tables_rewardLedger_mutations_grantStamp;
  "tables/rewardLedger/mutations/grantStampForOrder": typeof tables_rewardLedger_mutations_grantStampForOrder;
  "tables/rewardLedger/mutations/revokeStampForOrder": typeof tables_rewardLedger_mutations_revokeStampForOrder;
  "tables/rewardLedger/queries/fetchMyLedger": typeof tables_rewardLedger_queries_fetchMyLedger;
  "tables/rewardLedger/queries/fetchUserLedger": typeof tables_rewardLedger_queries_fetchUserLedger;
  "tables/rewardLedger/registerRewardLedgerCrons": typeof tables_rewardLedger_registerRewardLedgerCrons;
  "tables/rewardLedger/schemas/rewardLedgerSchema": typeof tables_rewardLedger_schemas_rewardLedgerSchema;
  "tables/users/userMutations": typeof tables_users_userMutations;
  "tables/users/userQueries": typeof tables_users_userQueries;
  "types/convexTypes": typeof types_convexTypes;
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
  betterAuth: import("../auth/component/_generated/component.js").ComponentApi<"betterAuth">;
  r2: import("@convex-dev/r2/_generated/component.js").ComponentApi<"r2">;
  analytics: import("@piton-/analytics-convex/_generated/component.js").ComponentApi<"analytics">;
};
