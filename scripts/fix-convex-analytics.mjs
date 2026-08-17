// Workaround for @vllnt/convex-analytics@0.1.0-canary.55667b0: its publish build skips
// `convex codegen` before `tsc`, so the tarball is missing
// dist/component/_generated/component.{d.ts,js}. The app's generated api.d.ts imports the
// ComponentApi type from that path, so a fresh `bun install` breaks typecheck until these
// two files exist. Re-write them if absent. Delete this script once upstream fixes its build.
//
// ponytail: content is hardcoded for the pinned canary version (caret won't bump prereleases).

import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dir = join(root, 'node_modules', '@vllnt', 'convex-analytics', 'dist', 'component', '_generated');
const dts = join(dir, 'component.d.ts');
const js = join(dir, 'component.js');

if (existsSync(dts) && existsSync(js)) process.exit(0);

const DTS = `/* eslint-disable */
/**
 * Generated \`ComponentApi\` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run \`npx convex dev\`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like \`components.myComponent\`.
 * Usage:
 * \`\`\`ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * \`\`\`
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    mutations: {
      configSet: FunctionReference<
        "mutation",
        "internal",
        { key: string; scope: string; value: string },
        null,
        Name
      >;
      configure: FunctionReference<
        "mutation",
        "internal",
        {
          retentionDays?: number;
          sampleRate?: number;
          scope: string;
          sessionIdleMs?: number;
        },
        null,
        Name
      >;
      track: FunctionReference<
        "mutation",
        "internal",
        {
          dedupeKey?: string;
          dimensions: Array<string>;
          granularities: Array<"minute" | "hour" | "day">;
          name: string;
          props?: Record<string, string | number | boolean | null>;
          sampleRate?: number;
          scope: string;
          sessionRef?: string;
          subjectRef?: string;
          ts?: number;
        },
        "tracked" | "dropped" | "duplicate",
        Name
      >;
    };
    queries: {
      configGet: FunctionReference<
        "query",
        "internal",
        { key: string; scope: string },
        string | null,
        Name
      >;
      distribution: FunctionReference<
        "query",
        "internal",
        {
          buckets: Array<number>;
          measure: string;
          name: string;
          range?: { from?: number; to?: number };
          scope: string;
          where?: { dim: string; val: string | number | boolean | null };
        },
        {
          bins: Array<{ count: number; upper: number }>;
          count: number;
          overflow: number;
          sum: number;
        },
        Name
      >;
      funnel: FunctionReference<
        "query",
        "internal",
        {
          range: { from?: number; to?: number };
          scope: string;
          steps: Array<string>;
        },
        Array<{ count: number; name: string; rate: number }>,
        Name
      >;
      list: FunctionReference<
        "query",
        "internal",
        {
          name: string;
          paginationOpts: { cursor: string | null; numItems: number };
          scope: string;
        },
        {
          continueCursor: string;
          isDone: boolean;
          page: Array<{
            _creationTime: number;
            _id: string;
            dedupeKey?: string;
            name: string;
            props: Record<string, string | number | boolean | null>;
            scope: string;
            seq: number;
            sessionRef?: string;
            subjectRef?: string;
            ts: number;
          }>;
        },
        Name
      >;
      metric: FunctionReference<
        "query",
        "internal",
        {
          name: string;
          range?: { from?: number; to?: number };
          scope: string;
          where?: { dim: string; val: string | number | boolean | null };
        },
        number,
        Name
      >;
      retention: FunctionReference<
        "query",
        "internal",
        {
          cohortRange: { from?: number; to?: number };
          granularity?: "minute" | "hour" | "day";
          periods: number;
          scope: string;
        },
        Array<{ cohort: number; retained: Array<number>; size: number }>,
        Name
      >;
      timeseries: FunctionReference<
        "query",
        "internal",
        {
          granularity: "minute" | "hour" | "day";
          name: string;
          range: { from?: number; to?: number };
          scope: string;
          where?: { dim: string; val: string | number | boolean | null };
        },
        Array<{ bucket: number; count: number }>,
        Name
      >;
      top: FunctionReference<
        "query",
        "internal",
        {
          dimension: string;
          limit?: number;
          name: string;
          range?: { from?: number; to?: number };
          scope: string;
        },
        Array<{ count: number; value: string }>,
        Name
      >;
      uniques: FunctionReference<
        "query",
        "internal",
        {
          granularity: "minute" | "hour" | "day";
          range: { from?: number; to?: number };
          scope: string;
        },
        {
          dau: number;
          mau: number;
          trend: Array<{ bucket: number; uniques: number }>;
          wau: number;
        },
        Name
      >;
    };
  };
`;

mkdirSync(dir, { recursive: true });
writeFileSync(dts, DTS);
writeFileSync(js, '/* eslint-disable */\nexport {};\n');
