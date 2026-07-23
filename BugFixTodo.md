# Bug Fix Todo

## `loadMore`-in-`$effect` drain loop crashes production

**File:** `src/components/pages/(protected)/admin/rewards/admin-rewards-add-form.svelte`

**Problem:** Same latent bug already fixed in the upsells builder. The component drains
the whole catalog with:

```js
$effect(() => {
  if (catalogQuery.status === 'CanLoadMore') catalogQuery.loadMore(PAGINATION_DATA.DEFAULT_PAGE_SIZE);
});
```

`loadMore()` transitions the status synchronously, which re-triggers the effect, which
calls `loadMore` again — an effect-update loop. In dev it happens to drain to `Exhausted`
before Svelte's re-entrancy guard trips; in the minified production scheduler it throws
`effect_update_depth_exceeded`, which kills the Svelte runtime (later navigations change
the URL but render nothing). It's data-dependent: the more pages the catalog has
(`fetchRewardCatalog` = up to ~500 products / 10 per page ≈ 50 pages), the more likely the
crash — so it will start failing in production as the catalog grows.

**Fix (same as `admin-upsells-customize-dialog.svelte`):** replace the drain-everything
`fetchRewardCatalog` + auto-`loadMore` effect with a **search-driven** picker using
`fetchAllProducts`' search mode (`{ search, status: 'active' }`), `usePaginatedQuery` args
returning `'skip'` until the admin types 2+ chars. No auto-`loadMore` effect at all. Nothing
loads until searched.

**Status:** Deferred (user chose not to do it now, 2026-07-23). Do NOT ship the rewards
admin to production with a large catalog before this is fixed.
