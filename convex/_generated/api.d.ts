/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as afk from "../afk.js";
import type * as economy from "../economy.js";
import type * as featureRequests from "../featureRequests.js";
import type * as invites from "../invites.js";
import type * as prefixes from "../prefixes.js";
import type * as reminders from "../reminders.js";
import type * as warnings from "../warnings.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  afk: typeof afk;
  economy: typeof economy;
  featureRequests: typeof featureRequests;
  invites: typeof invites;
  prefixes: typeof prefixes;
  reminders: typeof reminders;
  warnings: typeof warnings;
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

export declare const components: {};
