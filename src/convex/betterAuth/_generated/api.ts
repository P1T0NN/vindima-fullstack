/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as adapter from "../adapter.js";
import type * as auth from "../auth.js";
import type * as config from "../config.js";
import type * as emails_sendVerificationOTPEmail from "../emails/sendVerificationOTPEmail.js";
import type * as generatedSchema from "../generatedSchema.js";
import type * as helpers_getAuthUserId from "../helpers/getAuthUserId.js";
import type * as helpers_requireIdentity from "../helpers/requireIdentity.js";
import type * as helpers_sendOtpEmail from "../helpers/sendOtpEmail.js";
import type * as queries_getUser from "../queries/getUser.js";
import type * as queries_listUsers from "../queries/listUsers.js";
import type * as utils_userFilters from "../utils/userFilters.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import { anyApi, componentsGeneric } from "convex/server";

const fullApi: ApiFromModules<{
  adapter: typeof adapter;
  auth: typeof auth;
  config: typeof config;
  "emails/sendVerificationOTPEmail": typeof emails_sendVerificationOTPEmail;
  generatedSchema: typeof generatedSchema;
  "helpers/getAuthUserId": typeof helpers_getAuthUserId;
  "helpers/requireIdentity": typeof helpers_requireIdentity;
  "helpers/sendOtpEmail": typeof helpers_sendOtpEmail;
  "queries/getUser": typeof queries_getUser;
  "queries/listUsers": typeof queries_listUsers;
  "utils/userFilters": typeof utils_userFilters;
}> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
> = anyApi as any;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
> = anyApi as any;

export const components = componentsGeneric() as unknown as {};
