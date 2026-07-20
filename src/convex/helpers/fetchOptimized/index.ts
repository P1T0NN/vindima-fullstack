// Public surface of the fetchOptimized module. Guide: ./README.md
//
//   fetchOptimized.ts     — the list factory (where | search | union | resolve modes)
//   createSearchQuery.ts  — the dropdown/autocomplete search factory
//   types.ts              — all option/spec/payload types
//   kit.ts                — the exported building blocks for fully bespoke endpoints

export * from './types.js';
export * from './kit.js';
export { fetchOptimized } from './fetchOptimized.js';
export * from './createSearchQuery.js';
