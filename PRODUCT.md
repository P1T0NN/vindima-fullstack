# PRODUCT.md — Vindima

register: brand (public storefront: /, /shop, checkout funnel) · product (account, my-orders, /admin)

## Product Purpose

Vindima is the online storefront of an organic winery and table-experience house in
Aguascalientes, México. It sells wine, charcuterie boards (tablas), hogazas and paired
experiences for people hosting other people at home. The site takes orders for in-store
pickup or local delivery, paid online (Stripe) or in cash at pickup, and runs a
stamp-based loyalty club (buy N times, earn a free item).

## Users

- **Shoppers/hosts**: Spanish-speaking (es-MX) adults planning a dinner, a gift, or a
  gathering. Mostly mobile, arriving from Instagram. They know wine socially, not
  technically — copy must invite, never gatekeep.
- **Club members**: repeat customers tracking stamps and claiming reward items in
  /account. They care that history is accurate and rewards feel earned.
- **The owner (Alby) and staff**: run /admin daily on desktop — orders first, then
  products, categories, rewards, upsells, users. Efficiency over spectacle.

## Brand & Tone

The interface behaves like a cellar master's ledger: warm paper, ruled entries, serif
numerals, and a gold seal reserved for the moment something is decided (see DESIGN.md,
"The Cellar Ledger"). Voice: warm, hospitable, plain Spanish (tú), short sentences.
Never sommelier jargon, never discount-store urgency. The brand's one promise: "los
mejores momentos pasan alrededor de la mesa."

## Anti-references

What this site must never resemble:

- **SaaS dashboard chrome** — cool grays, blue-on-white utility UI, gradient hero
  metrics, icon+heading+text card grids.
- **Rustic-vineyard cliché** — woodgrain textures, script fonts, sepia filters,
  grape-emoji folklore.
- **Discount e-commerce** — countdown timers, red SALE badges, urgency banners,
  dark-pattern upsells. The upsell dialog offers, never pressures.

## Strategic Principles

1. **The ledger records; it does not redraw.** Orders are entries: snapshot names and
   prices at write time, resolve display extras live, never rewrite history.
2. **Gold = commitment.** If gold appears, something is actionable or has been decided.
   Decoration steps back to burgundy ink on warm paper.
3. **Money is sacred text.** Integer minor units in code; display serif + tabular-nums
   in totals; the total band is the visual full stop of every order surface.
4. **Spanish is the source language.** UI copy is written in es-MX and translated
   outward (wuchale). No em dashes in copy.
5. **Calm data.** One-shot fetches by default; realtime only where data changes under
   the viewer without them acting (see docs/GeneralSystemDesignRule.md).
