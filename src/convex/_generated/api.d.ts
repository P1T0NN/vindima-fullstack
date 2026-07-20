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
import type * as helpers_convexGetRateLimitedUserId from "../helpers/convexGetRateLimitedUserId.js";
import type * as helpers_createDeleteMutation from "../helpers/createDeleteMutation.js";
import type * as helpers_fetchOptimized_createSearchQuery from "../helpers/fetchOptimized/createSearchQuery.js";
import type * as helpers_fetchOptimized_fetchOptimized from "../helpers/fetchOptimized/fetchOptimized.js";
import type * as helpers_fetchOptimized_index from "../helpers/fetchOptimized/index.js";
import type * as helpers_fetchOptimized_kit from "../helpers/fetchOptimized/kit.js";
import type * as helpers_fetchOptimized_types from "../helpers/fetchOptimized/types.js";
import type * as helpers_mutationResult from "../helpers/mutationResult.js";
import type * as helpers_paginationHelpers from "../helpers/paginationHelpers.js";
import type * as http from "../http.js";
import type * as rateLimits_convexCreateRateLimit from "../rateLimits/convexCreateRateLimit.js";
import type * as rateLimits_convexCreateRateLimitInternal from "../rateLimits/convexCreateRateLimitInternal.js";
import type * as rateLimits_registry from "../rateLimits/registry.js";
import type * as rateLimits_searchRateLimitMutations from "../rateLimits/searchRateLimitMutations.js";
import type * as storage_convexStorage_storageMutations from "../storage/convexStorage/storageMutations.js";
import type * as storage_convexStorage_uploadedFiles from "../storage/convexStorage/uploadedFiles.js";
import type * as storage_crons_cleanupOrphanDataConvexStorage from "../storage/crons/cleanupOrphanDataConvexStorage.js";
import type * as storage_crons_cleanupOrphanDataR2 from "../storage/crons/cleanupOrphanDataR2.js";
import type * as storage_r2_r2 from "../storage/r2/r2.js";
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
import type * as tables_cart_mutations_addLine from "../tables/cart/mutations/addLine.js";
import type * as tables_cart_mutations_clearCart from "../tables/cart/mutations/clearCart.js";
import type * as tables_cart_mutations_mergeGuestCart from "../tables/cart/mutations/mergeGuestCart.js";
import type * as tables_cart_mutations_setLineQty from "../tables/cart/mutations/setLineQty.js";
import type * as tables_cart_queries_getMyCart from "../tables/cart/queries/getMyCart.js";
import type * as tables_cart_schemas_cartSchema from "../tables/cart/schemas/cartSchema.js";
import type * as tables_orders_crons_ordersCrons from "../tables/orders/crons/ordersCrons.js";
import type * as tables_orders_helpers_calculateOrderPrice from "../tables/orders/helpers/calculateOrderPrice.js";
import type * as tables_orders_mutations_cancelMyOrder from "../tables/orders/mutations/cancelMyOrder.js";
import type * as tables_orders_mutations_markOrderPaid from "../tables/orders/mutations/markOrderPaid.js";
import type * as tables_orders_mutations_markOrderRefunded from "../tables/orders/mutations/markOrderRefunded.js";
import type * as tables_orders_mutations_placeOrder from "../tables/orders/mutations/placeOrder.js";
import type * as tables_orders_mutations_setFulfillment from "../tables/orders/mutations/setFulfillment.js";
import type * as tables_orders_providers_manual from "../tables/orders/providers/manual.js";
import type * as tables_orders_providers_registry from "../tables/orders/providers/registry.js";
import type * as tables_orders_providers_types from "../tables/orders/providers/types.js";
import type * as tables_orders_queries_fetchMyLatestOrders from "../tables/orders/queries/fetchMyLatestOrders.js";
import type * as tables_orders_queries_fetchMyOrders from "../tables/orders/queries/fetchMyOrders.js";
import type * as tables_orders_queries_fetchOrder from "../tables/orders/queries/fetchOrder.js";
import type * as tables_orders_registerOrdersCrons from "../tables/orders/registerOrdersCrons.js";
import type * as tables_orders_schemas_ordersSchema from "../tables/orders/schemas/ordersSchema.js";
import type * as tables_orders_validators_ordersValidators from "../tables/orders/validators/ordersValidators.js";
import type * as tables_products_helpers_attachVariants from "../tables/products/helpers/attachVariants.js";
import type * as tables_products_helpers_resolveImageUrls from "../tables/products/helpers/resolveImageUrls.js";
import type * as tables_products_helpers_resolveRefs from "../tables/products/helpers/resolveRefs.js";
import type * as tables_products_mutations_createCategory from "../tables/products/mutations/createCategory.js";
import type * as tables_products_mutations_createProduct from "../tables/products/mutations/createProduct.js";
import type * as tables_products_mutations_deleteCategory from "../tables/products/mutations/deleteCategory.js";
import type * as tables_products_mutations_deleteProduct from "../tables/products/mutations/deleteProduct.js";
import type * as tables_products_mutations_editProduct from "../tables/products/mutations/editProduct.js";
import type * as tables_products_mutations_internalRestoreVariant from "../tables/products/mutations/internalRestoreVariant.js";
import type * as tables_products_mutations_renameCategory from "../tables/products/mutations/renameCategory.js";
import type * as tables_products_mutations_setProductStatus from "../tables/products/mutations/setProductStatus.js";
import type * as tables_products_mutations_setVariantRewardEligible from "../tables/products/mutations/setVariantRewardEligible.js";
import type * as tables_products_productsValidators from "../tables/products/productsValidators.js";
import type * as tables_products_queries_fetchAllCategories from "../tables/products/queries/fetchAllCategories.js";
import type * as tables_products_queries_fetchAllProducts from "../tables/products/queries/fetchAllProducts.js";
import type * as tables_products_queries_fetchProductById from "../tables/products/queries/fetchProductById.js";
import type * as tables_products_queries_fetchProductsByCategory from "../tables/products/queries/fetchProductsByCategory.js";
import type * as tables_products_queries_fetchRewardCatalog from "../tables/products/queries/fetchRewardCatalog.js";
import type * as tables_products_queries_resolveCartProducts from "../tables/products/queries/resolveCartProducts.js";
import type * as tables_products_schemas_productCategoriesSchema from "../tables/products/schemas/productCategoriesSchema.js";
import type * as tables_products_schemas_productsSchema from "../tables/products/schemas/productsSchema.js";
import type * as tables_rewards_crons_rewardsCrons from "../tables/rewards/crons/rewardsCrons.js";
import type * as tables_rewards_helpers_applyConfirmedStamp from "../tables/rewards/helpers/applyConfirmedStamp.js";
import type * as tables_rewards_helpers_getRewardsSnapshot from "../tables/rewards/helpers/getRewardsSnapshot.js";
import type * as tables_rewards_helpers_getWelcomeOfferEligibility from "../tables/rewards/helpers/getWelcomeOfferEligibility.js";
import type * as tables_rewards_helpers_grantStampCore from "../tables/rewards/helpers/grantStampCore.js";
import type * as tables_rewards_helpers_loadOrCreateAccount from "../tables/rewards/helpers/loadOrCreateAccount.js";
import type * as tables_rewards_mutations_adjustReward from "../tables/rewards/mutations/adjustReward.js";
import type * as tables_rewards_mutations_applyRewardClaim from "../tables/rewards/mutations/applyRewardClaim.js";
import type * as tables_rewards_mutations_cancelRewardClaim from "../tables/rewards/mutations/cancelRewardClaim.js";
import type * as tables_rewards_mutations_claimReward from "../tables/rewards/mutations/claimReward.js";
import type * as tables_rewards_mutations_grantStamp from "../tables/rewards/mutations/grantStamp.js";
import type * as tables_rewards_mutations_grantStampForOrder from "../tables/rewards/mutations/grantStampForOrder.js";
import type * as tables_rewards_mutations_rebuildRewardAccount from "../tables/rewards/mutations/rebuildRewardAccount.js";
import type * as tables_rewards_mutations_recordFirstPurchase from "../tables/rewards/mutations/recordFirstPurchase.js";
import type * as tables_rewards_mutations_releaseRewardClaim from "../tables/rewards/mutations/releaseRewardClaim.js";
import type * as tables_rewards_mutations_revokeStampForOrder from "../tables/rewards/mutations/revokeStampForOrder.js";
import type * as tables_rewards_queries_fetchMyLedger from "../tables/rewards/queries/fetchMyLedger.js";
import type * as tables_rewards_registerRewardsCrons from "../tables/rewards/registerRewardsCrons.js";
import type * as tables_rewards_schemas_rewardsSchema from "../tables/rewards/schemas/rewardsSchema.js";
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
  "helpers/convexGetRateLimitedUserId": typeof helpers_convexGetRateLimitedUserId;
  "helpers/createDeleteMutation": typeof helpers_createDeleteMutation;
  "helpers/fetchOptimized/createSearchQuery": typeof helpers_fetchOptimized_createSearchQuery;
  "helpers/fetchOptimized/fetchOptimized": typeof helpers_fetchOptimized_fetchOptimized;
  "helpers/fetchOptimized/index": typeof helpers_fetchOptimized_index;
  "helpers/fetchOptimized/kit": typeof helpers_fetchOptimized_kit;
  "helpers/fetchOptimized/types": typeof helpers_fetchOptimized_types;
  "helpers/mutationResult": typeof helpers_mutationResult;
  "helpers/paginationHelpers": typeof helpers_paginationHelpers;
  http: typeof http;
  "rateLimits/convexCreateRateLimit": typeof rateLimits_convexCreateRateLimit;
  "rateLimits/convexCreateRateLimitInternal": typeof rateLimits_convexCreateRateLimitInternal;
  "rateLimits/registry": typeof rateLimits_registry;
  "rateLimits/searchRateLimitMutations": typeof rateLimits_searchRateLimitMutations;
  "storage/convexStorage/storageMutations": typeof storage_convexStorage_storageMutations;
  "storage/convexStorage/uploadedFiles": typeof storage_convexStorage_uploadedFiles;
  "storage/crons/cleanupOrphanDataConvexStorage": typeof storage_crons_cleanupOrphanDataConvexStorage;
  "storage/crons/cleanupOrphanDataR2": typeof storage_crons_cleanupOrphanDataR2;
  "storage/r2/r2": typeof storage_r2_r2;
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
  "tables/cart/mutations/addLine": typeof tables_cart_mutations_addLine;
  "tables/cart/mutations/clearCart": typeof tables_cart_mutations_clearCart;
  "tables/cart/mutations/mergeGuestCart": typeof tables_cart_mutations_mergeGuestCart;
  "tables/cart/mutations/setLineQty": typeof tables_cart_mutations_setLineQty;
  "tables/cart/queries/getMyCart": typeof tables_cart_queries_getMyCart;
  "tables/cart/schemas/cartSchema": typeof tables_cart_schemas_cartSchema;
  "tables/orders/crons/ordersCrons": typeof tables_orders_crons_ordersCrons;
  "tables/orders/helpers/calculateOrderPrice": typeof tables_orders_helpers_calculateOrderPrice;
  "tables/orders/mutations/cancelMyOrder": typeof tables_orders_mutations_cancelMyOrder;
  "tables/orders/mutations/markOrderPaid": typeof tables_orders_mutations_markOrderPaid;
  "tables/orders/mutations/markOrderRefunded": typeof tables_orders_mutations_markOrderRefunded;
  "tables/orders/mutations/placeOrder": typeof tables_orders_mutations_placeOrder;
  "tables/orders/mutations/setFulfillment": typeof tables_orders_mutations_setFulfillment;
  "tables/orders/providers/manual": typeof tables_orders_providers_manual;
  "tables/orders/providers/registry": typeof tables_orders_providers_registry;
  "tables/orders/providers/types": typeof tables_orders_providers_types;
  "tables/orders/queries/fetchMyLatestOrders": typeof tables_orders_queries_fetchMyLatestOrders;
  "tables/orders/queries/fetchMyOrders": typeof tables_orders_queries_fetchMyOrders;
  "tables/orders/queries/fetchOrder": typeof tables_orders_queries_fetchOrder;
  "tables/orders/registerOrdersCrons": typeof tables_orders_registerOrdersCrons;
  "tables/orders/schemas/ordersSchema": typeof tables_orders_schemas_ordersSchema;
  "tables/orders/validators/ordersValidators": typeof tables_orders_validators_ordersValidators;
  "tables/products/helpers/attachVariants": typeof tables_products_helpers_attachVariants;
  "tables/products/helpers/resolveImageUrls": typeof tables_products_helpers_resolveImageUrls;
  "tables/products/helpers/resolveRefs": typeof tables_products_helpers_resolveRefs;
  "tables/products/mutations/createCategory": typeof tables_products_mutations_createCategory;
  "tables/products/mutations/createProduct": typeof tables_products_mutations_createProduct;
  "tables/products/mutations/deleteCategory": typeof tables_products_mutations_deleteCategory;
  "tables/products/mutations/deleteProduct": typeof tables_products_mutations_deleteProduct;
  "tables/products/mutations/editProduct": typeof tables_products_mutations_editProduct;
  "tables/products/mutations/internalRestoreVariant": typeof tables_products_mutations_internalRestoreVariant;
  "tables/products/mutations/renameCategory": typeof tables_products_mutations_renameCategory;
  "tables/products/mutations/setProductStatus": typeof tables_products_mutations_setProductStatus;
  "tables/products/mutations/setVariantRewardEligible": typeof tables_products_mutations_setVariantRewardEligible;
  "tables/products/productsValidators": typeof tables_products_productsValidators;
  "tables/products/queries/fetchAllCategories": typeof tables_products_queries_fetchAllCategories;
  "tables/products/queries/fetchAllProducts": typeof tables_products_queries_fetchAllProducts;
  "tables/products/queries/fetchProductById": typeof tables_products_queries_fetchProductById;
  "tables/products/queries/fetchProductsByCategory": typeof tables_products_queries_fetchProductsByCategory;
  "tables/products/queries/fetchRewardCatalog": typeof tables_products_queries_fetchRewardCatalog;
  "tables/products/queries/resolveCartProducts": typeof tables_products_queries_resolveCartProducts;
  "tables/products/schemas/productCategoriesSchema": typeof tables_products_schemas_productCategoriesSchema;
  "tables/products/schemas/productsSchema": typeof tables_products_schemas_productsSchema;
  "tables/rewards/crons/rewardsCrons": typeof tables_rewards_crons_rewardsCrons;
  "tables/rewards/helpers/applyConfirmedStamp": typeof tables_rewards_helpers_applyConfirmedStamp;
  "tables/rewards/helpers/getRewardsSnapshot": typeof tables_rewards_helpers_getRewardsSnapshot;
  "tables/rewards/helpers/getWelcomeOfferEligibility": typeof tables_rewards_helpers_getWelcomeOfferEligibility;
  "tables/rewards/helpers/grantStampCore": typeof tables_rewards_helpers_grantStampCore;
  "tables/rewards/helpers/loadOrCreateAccount": typeof tables_rewards_helpers_loadOrCreateAccount;
  "tables/rewards/mutations/adjustReward": typeof tables_rewards_mutations_adjustReward;
  "tables/rewards/mutations/applyRewardClaim": typeof tables_rewards_mutations_applyRewardClaim;
  "tables/rewards/mutations/cancelRewardClaim": typeof tables_rewards_mutations_cancelRewardClaim;
  "tables/rewards/mutations/claimReward": typeof tables_rewards_mutations_claimReward;
  "tables/rewards/mutations/grantStamp": typeof tables_rewards_mutations_grantStamp;
  "tables/rewards/mutations/grantStampForOrder": typeof tables_rewards_mutations_grantStampForOrder;
  "tables/rewards/mutations/rebuildRewardAccount": typeof tables_rewards_mutations_rebuildRewardAccount;
  "tables/rewards/mutations/recordFirstPurchase": typeof tables_rewards_mutations_recordFirstPurchase;
  "tables/rewards/mutations/releaseRewardClaim": typeof tables_rewards_mutations_releaseRewardClaim;
  "tables/rewards/mutations/revokeStampForOrder": typeof tables_rewards_mutations_revokeStampForOrder;
  "tables/rewards/queries/fetchMyLedger": typeof tables_rewards_queries_fetchMyLedger;
  "tables/rewards/registerRewardsCrons": typeof tables_rewards_registerRewardsCrons;
  "tables/rewards/schemas/rewardsSchema": typeof tables_rewards_schemas_rewardsSchema;
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
